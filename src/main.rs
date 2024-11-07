use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use calculator::Calculator;
use clap::Parser;
use color_eyre::eyre::Context;
use db::InMemory;
use futures::{
    future::{self, poll_fn},
    StreamExt, TryStreamExt,
};
use serde::{Deserialize, Serialize};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::tungstenite::Message;
use tower::{limit::RateLimitLayer, Service, ServiceBuilder};
use websocket::WebSocketAdapterLayer;

#[derive(Debug, Parser)]
struct Args {
    /// The address to bind to.
    #[arg(short, long, env, default_value = "127.0.0.1:3030")]
    address: String,
}

#[tokio::main]
async fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;

    let rust_log =
        std::env::var("RUST_LOG").unwrap_or_else(|_| format!("{}=debug", env!("CARGO_PKG_NAME")));
    tracing_subscriber::fmt()
        .with_env_filter(rust_log)
        .with_span_events(tracing_subscriber::fmt::format::FmtSpan::CLOSE)
        .init();

    let args = Args::parse();
    tracing::info!("parsed command line arguments: {args:?}");

    tokio::select! {
        _ = tokio::signal::ctrl_c() => {
            tracing::info!("gracefully shutting down");
        }
        _ =  start(&args.address) => {
            tracing::error!("server exited");
        }
    }

    Ok(())
}

async fn start(address: &str) -> color_eyre::Result<()> {
    let listener = TcpListener::bind(address)
        .await
        .context("failed to create tcp listener")?;
    tracing::info!("listening on: {}", address);

    let db = InMemory::new();

    loop {
        match listener.accept().await {
            Ok((stream, peer_addr)) => {
                let db = db.clone();
                tokio::spawn(async move {
                    tracing::info!("accepting connection to {peer_addr}");

                    let svc = ServiceBuilder::new()
                        .layer(RateLimitLayer::new(1, Duration::from_secs(1)))
                        .layer(WebSocketAdapterLayer)
                        .service(Calculator::new(db));

                    let svc = Arc::new(Mutex::new(svc));

                    match accept_connection(stream, svc).await {
                        Ok(()) => {
                            tracing::info!("web socket connect exited");
                        }
                        Err(e) => {
                            tracing::error!("failed to handle web socket connection: {e}");
                        }
                    };
                });
            }
            Err(e) => {
                tracing::error!("failed to accept tcp connection: {e}");
            }
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
enum ApiRequest {
    Add(TwoNumsRequest),
    Sub(TwoNumsRequest),
    SetVar(SetVarRequest),
    GetVar(GetVarRequest),
}

#[derive(Debug, Deserialize)]
struct TwoNumsRequest {
    x: u8,
    y: u8,
}

#[derive(Debug, Deserialize)]
struct SetVarRequest {
    name: String,
    value: String,
}

#[derive(Debug, Deserialize)]
struct GetVarRequest {
    name: String,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
enum ApiResponse {
    Add(OpResult),
    Sub(OpResult),
    SetVar(VarResult),
    GetVar(VarResult),
}

#[derive(Debug, Serialize)]
struct OpResult {
    result: u8,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
enum ErrorResponse {
    BadRequest(ErrorMessage),
}

#[derive(Debug, Serialize)]
struct ErrorMessage {
    message: String,
}

impl ErrorResponse {
    pub fn bad_request(message: String) -> Self {
        Self::BadRequest(ErrorMessage { message })
    }
}

#[derive(Debug, Serialize)]
struct VarResult {
    name: String,
    value: String,
}

async fn accept_connection(
    stream: TcpStream,
    svc: Arc<
        Mutex<
            impl Service<Message, Response = Message, Error = tokio_tungstenite::tungstenite::Error>,
        >,
    >,
) -> Result<(), tokio_tungstenite::tungstenite::Error> {
    tracing::info!("accepted connection");

    let ws_stream = tokio_tungstenite::accept_async(stream).await?;
    tracing::info!("new web socket connection established");

    let (write, read) = ws_stream.split();

    read.try_filter(|msg| future::ready(msg.is_text()))
        .and_then(|msg| {
            let svc = svc.clone();
            poll_fn(move |ctx| {
                let mut svc = svc.lock().expect("failed to get a lock on service");
                svc.poll_ready(ctx).map_ok(|()| msg.clone())
            })
        })
        .and_then(|msg| {
            let mut svc = svc.lock().expect("failed to get a lock on service");
            svc.call(msg)
        })
        .forward(write)
        .await?;

    Ok(())
}

mod db {
    use std::{
        collections::HashMap,
        sync::{Arc, Mutex},
    };

    use serde::Serialize;
    use thiserror::Error;

    pub trait Database: Clone + Send {
        type Error: std::error::Error + Serialize;

        fn set_var(
            &self,
            name: String,
            value: String,
        ) -> impl std::future::Future<Output = Result<(), Self::Error>> + Send;

        fn get_var(
            &self,
            name: String,
        ) -> impl std::future::Future<Output = Result<String, Self::Error>> + Send;
    }

    #[derive(Clone)]
    pub struct InMemory {
        map: Arc<Mutex<HashMap<String, String>>>,
    }

    impl InMemory {
        pub fn new() -> Self {
            Self {
                map: Arc::new(Mutex::new(HashMap::new())),
            }
        }
    }

    #[derive(Debug, Error, Serialize)]
    #[serde(tag = "type")]
    pub enum InMemoryError {
        #[error("failed to get database lock")]
        FailedToGetLock,
        #[error("no value found for {0:?}")]
        NoValueFound(Value),
    }

    #[derive(Debug, Serialize)]
    pub struct Value {
        name: String,
    }

    impl Database for InMemory {
        type Error = InMemoryError;

        async fn set_var(&self, name: String, value: String) -> Result<(), InMemoryError> {
            let mut map = self.map.lock().map_err(|e| {
                tracing::error!("failed to get a lock: {e}");
                InMemoryError::FailedToGetLock
            })?;
            map.insert(name, value);
            Ok(())
        }

        async fn get_var(&self, name: String) -> Result<String, InMemoryError> {
            let map = self.map.lock().map_err(|e| {
                tracing::error!("failed to get a lock: {e}");
                InMemoryError::FailedToGetLock
            })?;

            let value = map
                .get(&name)
                .ok_or(InMemoryError::NoValueFound(Value { name }))?
                .to_owned();

            Ok(value)
        }
    }
}

mod calculator {
    use std::task::{Context, Poll};

    use futures::future;
    use serde::Serialize;
    use thiserror::Error;
    use tower::Service;

    use crate::{
        db::{Database, InMemoryError},
        ApiRequest, ApiResponse, GetVarRequest, OpResult, SetVarRequest, TwoNumsRequest, VarResult,
    };

    #[derive(Debug, Error, Serialize)]
    #[serde(tag = "type")]
    pub enum CalculatorError {
        #[error("database error: {0}")]
        Database(#[from] InMemoryError),
    }

    #[derive(Clone)]
    pub struct Calculator<DB: Database> {
        db: DB,
    }

    impl<DB: Database> Calculator<DB> {
        pub fn new(db: DB) -> Self {
            Self { db }
        }
    }

    impl<DB> Service<ApiRequest> for Calculator<DB>
    where
        DB: Database + 'static,
        CalculatorError: From<<DB as Database>::Error>,
    {
        type Response = ApiResponse;
        type Error = CalculatorError;
        type Future = future::BoxFuture<'static, Result<Self::Response, Self::Error>>;

        fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }

        fn call(&mut self, request: ApiRequest) -> Self::Future {
            let db = self.db.clone();

            Box::pin(async move {
                Ok(match request {
                    ApiRequest::Add(TwoNumsRequest { x, y }) => ApiResponse::Add(OpResult {
                        result: x.wrapping_add(y),
                    }),
                    ApiRequest::Sub(TwoNumsRequest { x, y }) => ApiResponse::Sub(OpResult {
                        result: x.wrapping_sub(y),
                    }),
                    ApiRequest::SetVar(SetVarRequest { name, value }) => {
                        db.set_var(name.clone(), value.clone()).await?;
                        ApiResponse::SetVar(VarResult { name, value })
                    }
                    ApiRequest::GetVar(GetVarRequest { name }) => {
                        let value = db.get_var(name.clone()).await?;
                        ApiResponse::GetVar(VarResult { name, value })
                    }
                })
            })
        }
    }
}

mod websocket {
    use std::{
        error::Error,
        task::{Context, Poll},
    };

    use futures::{future, FutureExt};
    use serde::Serialize;
    use tokio_tungstenite::tungstenite::Message;
    use tower::{Layer, Service};

    use crate::{ApiRequest, ErrorResponse};

    #[derive(Clone)]
    pub struct WebSocketAdapter<S> {
        inner: S,
    }

    impl<S> WebSocketAdapter<S> {
        pub fn new(inner: S) -> Self {
            Self { inner }
        }
    }

    impl<S> Service<Message> for WebSocketAdapter<S>
    where
        S: Service<ApiRequest> + Clone,
        S::Response: Serialize,
        S::Future: Send + 'static,
        S::Error: Error + Serialize,
    {
        type Response = Message;
        type Error = tokio_tungstenite::tungstenite::Error;
        type Future = future::BoxFuture<'static, Result<Self::Response, Self::Error>>;

        fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }

        fn call(&mut self, request: Message) -> Self::Future {
            let body = if let Message::Text(body) = request {
                body
            } else {
                tracing::error!("received a non-text message: {request:?}");
                return future::ok(Message::text("i only understand text messages")).boxed();
            };

            let req = serde_json::from_str::<ApiRequest>(&body);
            match req {
                Ok(req) => self
                    .inner
                    .call(req)
                    .map(|body| {
                        Ok(match body {
                            Ok(res) => Message::text(
                                serde_json::to_string(&res)
                                    .expect("failed to serialize response to json"),
                            ),
                            Err(err) => {
                                tracing::error!("error occured while processing request: {err}");
                                Message::text(
                                    serde_json::to_string(&err)
                                        .expect("failed to serialize error response to json"),
                                )
                            }
                        })
                    })
                    .boxed(),
                Err(e) => {
                    tracing::error!("failed to decode json body: {e}");
                    let error = ErrorResponse::bad_request("failed to decode request".into());
                    future::ok(Message::text(
                        serde_json::to_string(&error)
                            .expect("failed to serialize error response to json"),
                    ))
                    .boxed()
                }
            }
        }
    }

    pub struct WebSocketAdapterLayer;

    impl<S> Layer<S> for WebSocketAdapterLayer {
        type Service = WebSocketAdapter<S>;

        fn layer(&self, inner: S) -> Self::Service {
            WebSocketAdapter::new(inner)
        }
    }
}
