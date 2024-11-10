use std::{sync::Arc, time::Duration};

use app::App;
use clap::Parser;
use db::SqlxDatabase;
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

type BoxStr = Box<str>;
type BoxList<T> = Box<[T]>;

#[derive(Debug, Parser)]
#[command(version, about)]
struct Args {
    /// Path to the sqlite database file.
    #[arg(env)]
    database: BoxStr,

    /// The address to bind to.
    #[arg(short, long, env, default_value = "127.0.0.1:3030")]
    address: BoxStr,
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
    let db = SqlxDatabase::new(args.database).await?;

    tokio::select! {
        _ = tokio::signal::ctrl_c() => {
            tracing::info!("shutting down gracefully due to CTRL+C signal");
        }
        _ = start(&args.address, db) => {
            tracing::error!("server exited");
        }
    }

    Ok(())
}

async fn start(address: &str, db: SqlxDatabase) -> color_eyre::Result<()> {
    use color_eyre::eyre::Context;

    let listener = TcpListener::bind(address)
        .await
        .context("failed to create tcp listener")?;
    tracing::info!("listening on: {}", address);

    loop {
        match listener.accept().await {
            Ok((stream, peer_addr)) => {
                let db = db.clone();
                tokio::spawn(async move {
                    tracing::info!("accepting connection to {peer_addr}");
                    accept_connection(stream, db).await;
                });
            }
            Err(err) => {
                tracing::error!("failed to accept tcp connection: {err}");
            }
        }
    }
}

async fn accept_connection(stream: TcpStream, db: SqlxDatabase) {
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
        .service(App::new(db));

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

    use crate::{BoxList, BoxStr};

    #[derive(Debug, Deserialize)]
    #[serde(tag = "type")]
    pub enum ApiRequest {
        ListRows(ListRowsRequest),
    }

    #[derive(Debug, Deserialize)]
    pub struct ListRowsRequest {
        pub table: BoxStr,
        pub select: BoxList<BoxStr>,
        pub request_id: BoxStr,
    }
}

mod responses {
    use std::collections::HashMap;

    use serde::Serialize;

    use crate::{BoxList, BoxStr};

    pub type Row = HashMap<BoxStr, serde_json::Value>;

    #[derive(Debug, Serialize)]
    #[serde(tag = "type")]
    pub enum ApiResponse {
        ListRows(ListRowsResponse),
    }

    #[derive(Debug, Serialize)]
    pub struct ListRowsResponse {
        pub table: BoxStr,
        pub rows: BoxList<Row>,
        pub request_id: BoxStr,
    }

    #[derive(Debug, Serialize)]
    #[serde(tag = "type")]
    pub enum ErrorResponse {
        BadRequest(ErrorMessage),
        NonTextMessage,
    }

    #[derive(Debug, Serialize)]
    pub struct ErrorMessage {
        message: BoxStr,
    }

    impl ErrorResponse {
        pub const fn bad_request(message: BoxStr) -> Self {
            Self::BadRequest(ErrorMessage { message })
        }
    }
}

mod db {
    use r2d2::Pool;
    use r2d2_sqlite::{rusqlite, SqliteConnectionManager};
    use rusqlite::types::ValueRef as SqlValue;
    use serde_json::Value as JsonValue;

    use crate::{responses::Row, BoxList, BoxStr};

    pub struct TableName(BoxStr);
    pub struct ColumnName(BoxStr);
    pub type Columns = Vec<ColumnName>;

    pub trait Database: Clone + Send {
        type Error: std::error::Error;

        fn check_table_name(
            &self,
            table_name: &str,
        ) -> impl std::future::Future<Output = Result<Option<TableName>, Self::Error>> + Send;

        fn check_column_names(
            &self,
            table_name: &TableName,
            column_names: &[BoxStr],
        ) -> impl std::future::Future<Output = Result<(Columns, Vec<BoxStr>), Self::Error>> + Send;

        fn list_rows(
            &self,
            table_name: TableName,
            column_names: Columns,
        ) -> impl std::future::Future<Output = Result<BoxList<Row>, Self::Error>> + Send;
    }

    #[derive(Clone)]
    pub struct SqlxDatabase {
        pool: Pool<SqliteConnectionManager>,
    }

    impl SqlxDatabase {
        pub async fn new(db: BoxStr) -> color_eyre::Result<Self> {
            use color_eyre::{eyre, eyre::Context};

            let manager = SqliteConnectionManager::file(db.as_ref());
            let pool = Pool::new(manager).context("failed to create database connection pool")?;

            {
                let pool = pool.clone();
                tokio::task::spawn_blocking(move || {
                    let conn = pool.get().context("failed to get a connection from pool")?;
                    let count = conn
                        .query_row(
                            r#"
                            SELECT count(*) as count
                            FROM sqlite_master
                            WHERE type = "table"
                            "#,
                            (),
                            |r| r.get::<_, i32>(0),
                        )
                        .context("database connectio verification failed")?;

                    tracing::info!("found {count} tables in {db}");

                    eyre::Ok(())
                })
                .await
                .context("failed to spawn a tokio task")??;
            }

            Ok(Self { pool })
        }

        async fn get_tables(&self) -> Result<BoxList<BoxStr>, rusqlite::Error> {
            let pool = self.pool.clone();
            tokio::task::spawn_blocking(move || -> Result<BoxList<BoxStr>, rusqlite::Error> {
                let conn = pool.get().expect("failed to get a connection from pool");

                let rows = conn
                    .prepare(r#"SELECT name FROM sqlite_master WHERE type = "table""#)?
                    .query_map((), |r| r.get::<_, BoxStr>(0))?
                    .collect::<Result<BoxList<_>, _>>()?;
                Ok(rows)
            })
            .await
            .expect("failed to spawn a tokio task")
        }

        async fn get_columns(
            &self,
            TableName(table_name): &TableName,
        ) -> Result<BoxList<BoxStr>, rusqlite::Error> {
            let pool = self.pool.clone();
            let sql = format!(r#"SELECT * FROM {table_name}"#);

            tokio::task::spawn_blocking(move || -> Result<BoxList<BoxStr>, rusqlite::Error> {
                let conn = pool.get().expect("failed to get a connection from pool");

                let columns = conn
                    .prepare(&sql)?
                    .column_names()
                    .into_iter()
                    .map(Into::into)
                    .collect();

                Ok(columns)
            })
            .await
            .expect("failed to spawn a tokio task")
        }
    }

    impl Database for SqlxDatabase {
        type Error = rusqlite::Error;

        async fn check_table_name(
            &self,
            table_name: &str,
        ) -> Result<Option<TableName>, Self::Error> {
            let table_name = table_name.to_lowercase();
            for table in self.get_tables().await? {
                if table.to_lowercase() == table_name {
                    return Ok(Some(TableName(table)));
                }
            }

            Ok(None)
        }

        async fn check_column_names(
            &self,
            table_name: &TableName,
            column_names: &[BoxStr],
        ) -> Result<(Columns, Vec<BoxStr>), Self::Error> {
            let all_columns = self.get_columns(table_name).await?;

            Ok(column_names.iter().fold(
                (
                    Vec::with_capacity(column_names.len()),
                    Vec::with_capacity(column_names.len()),
                ),
                |(mut found, mut not_found), n| {
                    match all_columns
                        .iter()
                        .find(|column| n.to_lowercase() == column.to_lowercase())
                        .map(|n| ColumnName(n.clone()))
                    {
                        Some(col) => {
                            found.push(col);
                        }
                        None => {
                            not_found.push(n.clone());
                        }
                    };

                    (found, not_found)
                },
            ))
        }

        async fn list_rows(
            &self,
            TableName(table_name): TableName,
            column_names: Columns,
        ) -> Result<BoxList<Row>, Self::Error> {
            let pool = self.pool.clone();
            tokio::task::spawn_blocking(move || -> Result<BoxList<Row>, rusqlite::Error> {
                let conn = pool.get().expect("failed to get a connection from pool");

                let selects = if column_names.is_empty() {
                    "*".into()
                } else {
                    column_names
                        .into_iter()
                        .map(|c| c.0)
                        .collect::<BoxList<_>>()
                        .join(",")
                };

                let sql = format!("SELECT {selects} FROM {table_name}");
                let mut stmt = conn.prepare(&sql)?;

                let column_names: BoxList<BoxStr> =
                    stmt.column_names().into_iter().map(Into::into).collect();

                let rows = stmt
                    .query_map((), |r| {
                        Ok(column_names
                            .iter()
                            .enumerate()
                            .map(|(i, name)| {
                                (
                                    name.clone(),
                                    rusqlite_value_to_json(
                                        r.get_ref(i).expect("failed to get column value"),
                                    ),
                                )
                            })
                            .collect())
                    })?
                    .collect::<Result<BoxList<_>, _>>()?;

                Ok(rows)
            })
            .await
            .expect("failed to spawn a tokio task")
        }
    }

    pub fn rusqlite_value_to_json(v: SqlValue) -> JsonValue {
        match v {
            SqlValue::Null => JsonValue::Null,
            SqlValue::Integer(x) => serde_json::json!(x),
            SqlValue::Real(x) => serde_json::json!(x),
            SqlValue::Text(s) => JsonValue::String(String::from_utf8_lossy(s).into_owned()),
            SqlValue::Blob(s) => serde_json::json!(s),
        }
    }
}

mod app {
    use std::task::{Context, Poll};

    use futures::future;
    use serde::Serialize;
    use thiserror::Error;
    use tower::Service;

    use crate::{
        db::Database,
        requests::ApiRequest,
        responses::{ApiResponse, ListRowsResponse},
        BoxStr,
    };

    pub struct App<DB: Database> {
        db: DB,
    }

    #[derive(Debug, Error, Serialize)]
    #[serde(tag = "type")]
    pub enum AppError<DBError: std::error::Error> {
        #[error("database operation failed: {error}")]
        DatabaseError {
            #[from]
            #[serde(skip)]
            error: DBError,
        },
        #[error("table not found: {table}")]
        TableNotFound { table: BoxStr },
        #[error("column not found: {columns:?}")]
        ColumnsNotFound { columns: Vec<BoxStr> },
    }

    impl<DB: Database> App<DB> {
        pub const fn new(db: DB) -> Self {
            Self { db }
        }
    }

    impl<DB> Service<ApiRequest> for App<DB>
    where
        DB: Database + 'static,
        AppError<DB::Error>: From<DB::Error>,
    {
        type Response = ApiResponse;
        type Error = AppError<DB::Error>;
        type Future = future::BoxFuture<'static, Result<Self::Response, Self::Error>>;

        fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }

        fn call(&mut self, request: ApiRequest) -> Self::Future {
            let db = self.db.clone();

            Box::pin(async move {
                let response = match request {
                    ApiRequest::ListRows(req) => {
                        let table_name = db.check_table_name(&req.table).await?.ok_or(
                            Self::Error::TableNotFound {
                                table: req.table.clone(),
                            },
                        )?;

                        let (found_columns, not_found_columns) =
                            db.check_column_names(&table_name, &req.select).await?;

                        if !not_found_columns.is_empty() {
                            return Err(Self::Error::ColumnsNotFound {
                                columns: not_found_columns,
                            });
                        }

                        let rows = db.list_rows(table_name, found_columns).await?;
                        ApiResponse::ListRows(ListRowsResponse {
                            table: req.table,
                            rows,
                            request_id: req.request_id,
                        })
                    }
                };

                Ok(response)
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
