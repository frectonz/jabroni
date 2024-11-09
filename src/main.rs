use std::{sync::Arc, time::Duration};

use calculator::Calculator;
use clap::Parser;
use db::InMemory;
use futures::{future::poll_fn, SinkExt, StreamExt};
use responses::ErrorResponse;
use tokio::{
    net::{TcpListener, TcpStream},
    sync::{mpsc, Mutex},
};
use tokio_stream::wrappers::UnboundedReceiverStream;
use tokio_tungstenite::tungstenite::Message as WsMessage;
use tower::{limit::RateLimitLayer, Service, ServiceBuilder};
use websocket::WebSocketAdapterLayer;

#[derive(Debug, Parser)]
#[command(version, about)]
struct Args {
    /// The address to bind to.
    #[arg(short, long, env, default_value = "127.0.0.1:3030")]
    address: Box<str>,
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
            tracing::info!("shutting down gracefully due to CTRL+C signal");
        }
        _ = start(&args.address) => {
            tracing::error!("server exited");
        }
    }

    Ok(())
}

async fn start(address: &str) -> color_eyre::Result<()> {
    use color_eyre::eyre::Context;

    let listener = TcpListener::bind(address)
        .await
        .context("failed to create tcp listener")?;
    tracing::info!("listening on: {}", address);

    loop {
        match listener.accept().await {
            Ok((stream, peer_addr)) => {
                tokio::spawn(async move {
                    tracing::info!("accepting connection to {peer_addr}");
                    accept_connection(stream).await;
                });
            }
            Err(err) => {
                tracing::error!("failed to accept tcp connection: {err}");
            }
        }
    }
}

async fn accept_connection(stream: TcpStream) {
    tracing::info!("accepted connection");

    let (mut ws_tx, mut ws_rx) = match tokio_tungstenite::accept_async(stream).await {
        Ok(ws_stream) => {
            tracing::info!("new websocket connection established");
            ws_stream.split()
        }
        Err(err) => {
            tracing::error!("failed to establish websocket connection: {err}");
            return;
        }
    };

    let (tx, rx) = mpsc::unbounded_channel();
    let mut rx = UnboundedReceiverStream::new(rx);

    tokio::spawn(async move {
        while let Some(message) = rx.next().await {
            ws_tx.send(message).await.unwrap_or_else(|err| {
                tracing::error!("websocket send error: {err}");
            });
        }
    });

    let svc = ServiceBuilder::new()
        .layer(RateLimitLayer::new(1, Duration::from_secs(1)))
        .layer(WebSocketAdapterLayer)
        .service(Calculator::new(InMemory::new()));

    let svc = Arc::new(Mutex::new(svc));

    while let Some(result) = ws_rx.next().await {
        let tx = tx.clone();

        let request = match result {
            Ok(WsMessage::Text(body)) => body,
            Ok(WsMessage::Close(_)) => {
                tracing::warn!("connection is closed");
                break;
            }
            Ok(_) => {
                tracing::warn!("received unsupported websocket message type");

                let error = ErrorResponse::NonTextMessage;
                let msg = WsMessage::text(
                    serde_json::to_string(&error)
                        .expect("failed to serialize error response to json"),
                );

                tx.send(msg)
                    .map_err(|e| tracing::error!("failed to send message to client: {e}"))
                    .unwrap_or_default();
                break;
            }
            Err(err) => {
                tracing::error!("failed to recieve mesage: {err}");
                break;
            }
        };

        let mut locked = svc.lock().await;
        poll_fn(move |ctx| locked.poll_ready(ctx))
            .await
            .unwrap_or_else(|e| tracing::error!("service failed to become ready: {e}"));

        let mut locked = svc.lock().await;
        match locked.call(request).await {
            Ok(msg) => {
                tx.send(msg)
                    .map_err(|e| tracing::error!("failed to send message to client: {e}"))
                    .unwrap_or_default();
            }
            Err(err) => {
                tracing::error!("failed to process message: {err}")
            }
        };
    }
}

mod requests {
    use serde::Deserialize;

    #[derive(Debug, Deserialize)]
    #[serde(tag = "type")]
    pub enum ApiRequest {
        Add(TwoNumsRequest),
        Sub(TwoNumsRequest),
        SetVar(SetVarRequest),
        GetVar(GetVarRequest),
    }

    #[derive(Debug, Deserialize)]
    pub struct TwoNumsRequest {
        pub x: u8,
        pub y: u8,
        pub request_id: Box<str>,
    }

    #[derive(Debug, Deserialize)]
    pub struct SetVarRequest {
        pub name: Box<str>,
        pub value: Box<str>,
        pub request_id: Box<str>,
    }

    #[derive(Debug, Deserialize)]
    pub struct GetVarRequest {
        pub name: Box<str>,
        pub request_id: Box<str>,
    }
}

mod responses {
    use serde::Serialize;

    #[derive(Debug, Serialize)]
    #[serde(tag = "type")]
    pub enum ApiResponse {
        Add(OpResult),
        Sub(OpResult),
        SetVar(VarResult),
        GetVar(VarResult),
    }

    #[derive(Debug, Serialize)]
    pub struct OpResult {
        pub result: u8,
        pub request_id: Box<str>,
    }

    #[derive(Debug, Serialize)]
    pub struct VarResult {
        pub name: Box<str>,
        pub value: Box<str>,
        pub request_id: Box<str>,
    }

    #[derive(Debug, Serialize)]
    #[serde(tag = "type")]
    pub enum ErrorResponse {
        BadRequest(ErrorMessage),
        NonTextMessage,
    }

    #[derive(Debug, Serialize)]
    pub struct ErrorMessage {
        message: Box<str>,
    }

    impl ErrorResponse {
        pub const fn bad_request(message: Box<str>) -> Self {
            Self::BadRequest(ErrorMessage { message })
        }
    }
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
            name: &str,
            value: &str,
        ) -> impl std::future::Future<Output = Result<(), Self::Error>> + Send;

        fn get_var(
            &self,
            name: &str,
        ) -> impl std::future::Future<Output = Result<Box<str>, Self::Error>> + Send;
    }

    #[derive(Clone)]
    pub struct InMemory {
        map: Arc<Mutex<HashMap<Box<str>, Box<str>>>>,
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
        name: Box<str>,
    }

    impl Database for InMemory {
        type Error = InMemoryError;

        async fn set_var(&self, name: &str, value: &str) -> Result<(), InMemoryError> {
            self.map
                .lock()
                .map_err(|e| {
                    tracing::error!("failed to acquire database lock for `set_var` operation: {e}");
                    InMemoryError::FailedToGetLock
                })?
                .insert(name.into(), value.into());
            Ok(())
        }

        async fn get_var(&self, name: &str) -> Result<Box<str>, InMemoryError> {
            let value = self
                .map
                .lock()
                .map_err(|e| {
                    tracing::error!("failed to acquire database lock for `get_var` operation: {e}");
                    InMemoryError::FailedToGetLock
                })?
                .get(name)
                .ok_or(InMemoryError::NoValueFound(Value { name: name.into() }))?
                .to_owned();

            Ok(value)
        }
    }
}

mod calculator {
    use std::task::{Context, Poll};

    use futures::future;
    use tower::Service;

    use crate::{
        db::Database,
        requests::{ApiRequest, GetVarRequest, SetVarRequest, TwoNumsRequest},
        responses::{ApiResponse, OpResult, VarResult},
    };

    pub struct Calculator<DB: Database> {
        db: DB,
    }

    impl<DB: Database> Calculator<DB> {
        pub const fn new(db: DB) -> Self {
            Self { db }
        }
    }

    impl<DB> Service<ApiRequest> for Calculator<DB>
    where
        DB: Database + 'static,
    {
        type Response = ApiResponse;
        type Error = DB::Error;
        type Future = future::BoxFuture<'static, Result<Self::Response, Self::Error>>;

        fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }

        fn call(&mut self, request: ApiRequest) -> Self::Future {
            let db = self.db.clone();

            Box::pin(async move {
                Ok(match request {
                    ApiRequest::Add(TwoNumsRequest { x, y, request_id }) => {
                        ApiResponse::Add(OpResult {
                            result: x.wrapping_add(y),
                            request_id,
                        })
                    }
                    ApiRequest::Sub(TwoNumsRequest { x, y, request_id }) => {
                        ApiResponse::Sub(OpResult {
                            result: x.wrapping_sub(y),
                            request_id,
                        })
                    }
                    ApiRequest::SetVar(SetVarRequest {
                        name,
                        value,
                        request_id,
                    }) => {
                        db.set_var(&name, &value).await?;
                        ApiResponse::SetVar(VarResult {
                            name,
                            value,
                            request_id,
                        })
                    }
                    ApiRequest::GetVar(GetVarRequest { name, request_id }) => {
                        let value = db.get_var(&name).await?;
                        ApiResponse::GetVar(VarResult {
                            name,
                            value,
                            request_id,
                        })
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
    use tower::{Layer, Service};

    use crate::{requests::ApiRequest, responses::ErrorResponse, WsMessage};

    pub struct WebSocketAdapter<S> {
        inner: S,
    }

    impl<S> WebSocketAdapter<S> {
        pub const fn new(inner: S) -> Self {
            Self { inner }
        }
    }

    impl<S> Service<String> for WebSocketAdapter<S>
    where
        S: Service<ApiRequest>,
        S::Response: Serialize,
        S::Future: Send + 'static,
        S::Error: Error + Serialize + Send + 'static,
    {
        type Response = WsMessage;
        type Error = S::Error;
        type Future = future::BoxFuture<'static, Result<Self::Response, Self::Error>>;

        fn poll_ready(&mut self, ctx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
            self.inner.poll_ready(ctx)
        }

        fn call(&mut self, request: String) -> Self::Future {
            let req = serde_json::from_str::<ApiRequest>(&request);

            match req {
                Ok(req) => self
                    .inner
                    .call(req)
                    .map(|body| Ok(to_message(body)))
                    .boxed(),
                Err(err) => {
                    tracing::error!("failed to decode json request body: {err}");
                    let err = ErrorResponse::bad_request("failed to decode request".into());
                    let err = serde_json::to_string(&err)
                        .expect("failed to serialize error response to json");
                    future::ok(WsMessage::text(err)).boxed()
                }
            }
        }
    }

    fn to_message<R, E>(body: Result<R, E>) -> WsMessage
    where
        R: Serialize,
        E: Serialize + Error,
    {
        match body {
            Ok(resp) => {
                let resp =
                    serde_json::to_string(&resp).expect("failed to serialize response to json");
                WsMessage::text(resp)
            }

            Err(err) => {
                tracing::error!("error occured while processing request: {err}");
                let err = serde_json::to_string(&err)
                    .expect("failed to serialize error response to json");
                WsMessage::text(err)
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
