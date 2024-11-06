use calculator::Calculator;
use clap::Parser;
use color_eyre::eyre::Context;
use futures::{future, FutureExt, StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use tokio::net::{TcpListener, TcpStream};
use tower::Service;

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

    loop {
        match listener.accept().await {
            Ok((stream, peer_addr)) => {
                tracing::info!("accepted connection to {peer_addr}");
                match accept_connection(stream).await {
                    Ok(()) => {
                        tracing::info!("web socket connection existed");
                    }
                    Err(e) => {
                        tracing::error!("failed to handle web socket connection: {e}");
                    }
                };
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
}

#[derive(Debug, Deserialize)]
struct TwoNumsRequest {
    x: u8,
    y: u8,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
enum ApiResponse {
    AddResult(OpResult),
    SubResult(OpResult),
}

#[derive(Debug, Serialize)]
struct OpResult {
    result: u8,
}

async fn accept_connection(stream: TcpStream) -> Result<(), tokio_tungstenite::tungstenite::Error> {
    let ws_stream = tokio_tungstenite::accept_async(stream).await?;
    tracing::info!("new web socket connection established");

    let (write, read) = ws_stream.split();

    use tokio_tungstenite::tungstenite::Message;

    let mut svc = Calculator;

    let _ = read
        .and_then(|msg| {
            if let Message::Text(body) = msg {
                let req = serde_json::from_str::<ApiRequest>(&body);
                match req {
                    Ok(req) => {
                        let res = svc
                            .call(req)
                            .map(|body| {
                                Ok(match body {
                                    Ok(res) => Message::text(serde_json::to_string(&res).unwrap()),
                                    Err(_) => {
                                        Message::text("error occured while processing request")
                                    }
                                })
                            })
                            .boxed();

                        res
                    }
                    Err(e) => {
                        tracing::error!("failed to decode json body: {e}");
                        future::ok(Message::text("failed to decode json body")).boxed()
                    }
                }
            } else {
                tracing::error!("received a non-text message");
                future::ok(Message::text("i only understand text messages")).boxed()
            }
        })
        .forward(write)
        .await;

    Ok(())
}

mod calculator {
    use std::task::{Context, Poll};

    use futures::future;
    use tower::Service;

    use crate::{ApiRequest, ApiResponse, OpResult, TwoNumsRequest};

    pub struct Calculator;

    impl Service<ApiRequest> for Calculator {
        type Response = ApiResponse;
        type Error = std::convert::Infallible;
        type Future = future::Ready<Result<ApiResponse, std::convert::Infallible>>;

        fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }

        fn call(&mut self, request: ApiRequest) -> Self::Future {
            future::ok(match request {
                ApiRequest::Add(TwoNumsRequest { x, y }) => ApiResponse::AddResult(OpResult {
                    result: x.wrapping_add(y),
                }),
                ApiRequest::Sub(TwoNumsRequest { x, y }) => ApiResponse::SubResult(OpResult {
                    result: x.wrapping_sub(y),
                }),
            })
        }
    }
}
