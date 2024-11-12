use std::{sync::Arc, time::Duration};

use app::App;
use clap::Parser;
use db::SqliteDatabase;
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
    let db = SqliteDatabase::new(args.database).await?;

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

async fn start(address: &str, db: SqliteDatabase) -> color_eyre::Result<()> {
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

async fn accept_connection(stream: TcpStream, db: SqliteDatabase) {
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
    use std::{collections::HashMap, fmt::Display};

    use serde::Deserialize;
    use serde_json::Value as JsonValue;

    use crate::{BoxList, BoxStr};

    #[derive(Debug, Deserialize)]
    #[serde(tag = "type")]
    pub enum ApiRequest {
        ListRows(ListRowsRequest),
        GetRow(GetRowRequest),
        InsertRow(InsertRowRequest),
        DeleteRow(DeleteRowRequest),
        UpdateRow(UpdateRowRequest),
    }

    #[derive(Debug, Deserialize)]
    pub struct ListRowsRequest {
        pub table: BoxStr,
        pub select: BoxList<BoxStr>,
        pub sort: Option<SortInfo>,
        pub page: Option<Pagination>,
        pub request_id: BoxStr,
    }

    #[derive(Debug, Deserialize)]
    pub struct SortInfo {
        pub column: BoxStr,
        pub order: SortOrder,
    }

    #[derive(Debug, Deserialize)]
    pub enum SortOrder {
        Asc,
        Desc,
    }

    impl Display for SortOrder {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            match self {
                SortOrder::Asc => write!(f, "ASC"),
                SortOrder::Desc => write!(f, "DESC"),
            }
        }
    }

    #[derive(Debug, Deserialize)]
    pub struct Pagination {
        pub number: u32,
        pub size: u32,
    }

    #[derive(Debug, Deserialize)]
    pub struct GetRowRequest {
        pub table: BoxStr,
        pub key: JsonValue,
        pub select: BoxList<BoxStr>,
        pub request_id: BoxStr,
    }

    #[derive(Debug, Deserialize)]
    pub struct InsertRowRequest {
        pub table: BoxStr,
        pub data: HashMap<BoxStr, JsonValue>,
        pub request_id: BoxStr,
    }

    #[derive(Debug, Deserialize)]
    pub struct DeleteRowRequest {
        pub table: BoxStr,
        pub key: JsonValue,
        pub request_id: BoxStr,
    }

    #[derive(Debug, Deserialize)]
    pub struct UpdateRowRequest {
        pub table: BoxStr,
        pub key: JsonValue,
        pub data: HashMap<BoxStr, JsonValue>,
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
        GetRow(GetRowResponse),
        InsertRow(InsertRowResponse),
        DeleteRow(DeleteRowResponse),
        UpdateRow(UpdateRowResponse),
    }

    #[derive(Debug, Serialize)]
    pub struct ListRowsResponse {
        pub table: BoxStr,
        pub rows: BoxList<Row>,
        pub request_id: BoxStr,
    }

    #[derive(Debug, Serialize)]
    pub struct GetRowResponse {
        pub table: BoxStr,
        pub row: Row,
        pub request_id: BoxStr,
    }

    #[derive(Debug, Serialize)]
    pub struct InsertRowResponse {
        pub table: BoxStr,
        pub inserted_rows: usize,
        pub request_id: BoxStr,
    }

    #[derive(Debug, Serialize)]
    pub struct DeleteRowResponse {
        pub table: BoxStr,
        pub deleted_rows: usize,
        pub request_id: BoxStr,
    }

    #[derive(Debug, Serialize)]
    pub struct UpdateRowResponse {
        pub table: BoxStr,
        pub updated_rows: usize,
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
    use std::collections::HashMap;

    use r2d2::Pool;
    use r2d2_sqlite::{rusqlite, SqliteConnectionManager};
    use rusqlite::types::Value as SqlValue;
    use serde_json::Value as JsonValue;

    use crate::{
        requests::{Pagination, SortOrder},
        responses::Row,
        BoxList, BoxStr,
    };

    pub struct TableName(BoxStr);
    #[derive(Eq, PartialEq, Hash, Clone, Debug)]
    pub struct ColumnName(BoxStr);
    pub type Columns = Vec<ColumnName>;

    impl ColumnName {
        pub fn as_str(&self) -> &str {
            &self.0
        }
    }

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

        fn check_column_name(
            &self,
            table_name: &TableName,
            column_name: &str,
        ) -> impl std::future::Future<Output = Result<Option<ColumnName>, Self::Error>> + Send;

        fn list_rows(
            &self,
            table_name: TableName,
            column_names: Columns,
            sort_info: Option<(ColumnName, SortOrder)>,
            page: Option<Pagination>,
        ) -> impl std::future::Future<Output = Result<BoxList<Row>, Self::Error>> + Send;

        fn get_row(
            &self,
            table_name: TableName,
            key: JsonValue,
            column_names: Columns,
        ) -> impl std::future::Future<Output = Result<Option<Row>, Self::Error>> + Send;

        fn insert_row(
            &self,
            table_name: TableName,
            data: HashMap<ColumnName, serde_json::Value>,
        ) -> impl std::future::Future<Output = Result<usize, Self::Error>> + Send;

        fn delete_row(
            &self,
            table_name: TableName,
            key: JsonValue,
        ) -> impl std::future::Future<Output = Result<usize, Self::Error>> + Send;

        fn update_row(
            &self,
            table_name: TableName,
            key: JsonValue,
            data: HashMap<ColumnName, serde_json::Value>,
        ) -> impl std::future::Future<Output = Result<Option<usize>, Self::Error>> + Send;
    }

    #[derive(Clone)]
    pub struct SqliteDatabase {
        pool: Pool<SqliteConnectionManager>,
    }

    impl SqliteDatabase {
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

        async fn get_primary_key(
            &self,
            TableName(table_name): &TableName,
        ) -> Result<ColumnName, rusqlite::Error> {
            let pool = self.pool.clone();
            let sql = format!(r#"PRAGMA table_info({table_name})"#);

            tokio::task::spawn_blocking(move || -> Result<ColumnName, rusqlite::Error> {
                let conn = pool.get().expect("failed to get a connection from pool");
                let mut stmt = conn.prepare(&sql)?;

                let primary_keys: BoxList<(BoxStr, bool)> = stmt
                    .query_map((), |r| Ok((r.get(1)?, r.get(5)?)))?
                    .collect::<Result<_, _>>()?;

                let primary_key = primary_keys
                    .iter()
                    .find_map(|(column, pk)| if *pk { Some(column) } else { None })
                    .expect("no column found at primary key index");

                Ok(ColumnName(primary_key.clone()))
            })
            .await
            .expect("failed to spawn a tokio task")
        }
    }

    impl Database for SqliteDatabase {
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

        async fn check_column_name(
            &self,
            table_name: &TableName,
            column_name: &str,
        ) -> Result<Option<ColumnName>, Self::Error> {
            let column_name = column_name.to_lowercase();
            for column in self.get_columns(table_name).await? {
                if column.to_lowercase() == column_name {
                    return Ok(Some(ColumnName(column)));
                }
            }

            Ok(None)
        }

        async fn list_rows(
            &self,
            TableName(table_name): TableName,
            column_names: Columns,
            sort_info: Option<(ColumnName, SortOrder)>,
            page: Option<Pagination>,
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

                let sort = sort_info
                    .map(|(ColumnName(col), sort_order)| format!("ORDER BY {col} {sort_order}"))
                    .unwrap_or_default();

                let limit = page
                    .map(|Pagination { number, size }| {
                        let offset = (number - 1) * size;
                        format!("LIMIT {size} OFFSET {offset}")
                    })
                    .unwrap_or_default();

                let sql = format!("SELECT {selects} FROM {table_name} {sort} {limit}");
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
                                    rusqlite_to_json(
                                        r.get_ref(i).expect("failed to get column value").into(),
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

        async fn get_row(
            &self,
            table_name: TableName,
            key: JsonValue,
            column_names: Columns,
        ) -> Result<Option<Row>, Self::Error> {
            let ColumnName(primary_key) = self.get_primary_key(&table_name).await?;
            let pool = self.pool.clone();

            let result = tokio::task::spawn_blocking(move || -> Result<Row, rusqlite::Error> {
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

                let TableName(table_name) = table_name;
                let sql = format!("SELECT {selects} FROM {table_name} WHERE {primary_key} = ?");

                let mut stmt = conn.prepare(&sql)?;
                let column_names: BoxList<BoxStr> =
                    stmt.column_names().into_iter().map(Into::into).collect();

                let key = json_to_rusqlite(key);
                let row = stmt.query_row([key], |r| {
                    Ok(column_names
                        .iter()
                        .enumerate()
                        .map(|(i, name)| {
                            (
                                name.clone(),
                                rusqlite_to_json(
                                    r.get_ref(i).expect("failed to get column value").into(),
                                ),
                            )
                        })
                        .collect())
                })?;

                Ok(row)
            })
            .await
            .expect("failed to spawn a tokio task");

            match result {
                Ok(row) => Ok(Some(row)),
                Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
                Err(err) => Err(err),
            }
        }

        async fn insert_row(
            &self,
            TableName(table_name): TableName,
            data: HashMap<ColumnName, serde_json::Value>,
        ) -> Result<usize, Self::Error> {
            let pool = self.pool.clone();

            tokio::task::spawn_blocking(move || -> Result<usize, rusqlite::Error> {
                let conn = pool.get().expect("failed to get a connection from pool");

                let columns = data
                    .keys()
                    .cloned()
                    .map(|ColumnName(col)| col)
                    .collect::<Vec<_>>()
                    .join(",");

                let values = data
                    .into_values()
                    .map(json_to_rusqlite)
                    .map(rusqlite_to_str)
                    .collect::<Vec<_>>()
                    .join(",");

                let sql = format!("INSERT INTO {table_name} ({columns}) VALUES ({values})");
                conn.execute(&sql, ())
            })
            .await
            .expect("failed to spawn a tokio task")
        }

        async fn delete_row(
            &self,
            table_name: TableName,
            key: JsonValue,
        ) -> Result<usize, Self::Error> {
            let ColumnName(primary_key) = self.get_primary_key(&table_name).await?;
            let pool = self.pool.clone();

            tokio::task::spawn_blocking(move || -> Result<usize, rusqlite::Error> {
                let conn = pool.get().expect("failed to get a connection from pool");

                let TableName(table_name) = table_name;
                let sql = format!("DELETE FROM {table_name} WHERE {primary_key} = ?");

                let key = json_to_rusqlite(key);
                conn.execute(&sql, [key])
            })
            .await
            .expect("failed to spawn a tokio task")
        }

        async fn update_row(
            &self,
            table_name: TableName,
            key: JsonValue,
            data: HashMap<ColumnName, serde_json::Value>,
        ) -> Result<Option<usize>, Self::Error> {
            let ColumnName(primary_key) = self.get_primary_key(&table_name).await?;
            let pool = self.pool.clone();

            let result = tokio::task::spawn_blocking(move || -> Result<usize, rusqlite::Error> {
                let conn = pool.get().expect("failed to get a connection from pool");

                let updates = data
                    .into_iter()
                    .map(|(ColumnName(col), val)| (col, json_to_rusqlite(val)))
                    .map(|(col, val)| (col, rusqlite_to_str(val)))
                    .map(|(col, val)| format!("{col} = {val}"))
                    .collect::<Vec<_>>()
                    .join(",");

                let TableName(table_name) = table_name;
                let sql = format!("UPDATE {table_name} SET {updates} WHERE {primary_key} = ?");

                let key = json_to_rusqlite(key);
                conn.execute(&sql, [key])
            })
            .await
            .expect("failed to spawn a tokio task");

            match result {
                Ok(row) => Ok(Some(row)),
                Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
                Err(err) => Err(err),
            }
        }
    }

    pub fn rusqlite_to_json(v: SqlValue) -> JsonValue {
        match v {
            SqlValue::Null => JsonValue::Null,
            SqlValue::Integer(x) => serde_json::json!(x),
            SqlValue::Real(x) => serde_json::json!(x),
            SqlValue::Text(s) => JsonValue::String(s),
            SqlValue::Blob(s) => serde_json::json!(s),
        }
    }

    pub fn rusqlite_to_str(v: SqlValue) -> BoxStr {
        match v {
            SqlValue::Null => Box::from("null"),
            SqlValue::Integer(x) => x.to_string().into(),
            SqlValue::Real(x) => x.to_string().into(),
            SqlValue::Text(s) => format!("'{s}'").into(),
            SqlValue::Blob(s) => format!("X'{}'", hex::encode(s)).into(),
        }
    }

    pub fn json_to_rusqlite(v: JsonValue) -> SqlValue {
        match v {
            JsonValue::Null => SqlValue::Null,
            JsonValue::Number(x) => {
                if let Some(x) = x.as_i64() {
                    return SqlValue::Integer(x);
                }
                if let Some(x) = x.as_f64() {
                    return SqlValue::Real(x);
                }

                panic!("json number value {x} can not be transformed into a sqlite number value");
            }
            JsonValue::String(s) => SqlValue::Text(s),
            _ => {
                panic!("expected json key to be number or string");
            }
        }
    }
}

mod app {
    use std::{
        collections::HashMap,
        task::{Context, Poll},
    };

    use futures::future;
    use serde::Serialize;
    use thiserror::Error;
    use tower::Service;

    use crate::{
        db::Database,
        requests::ApiRequest,
        responses::{
            ApiResponse, DeleteRowResponse, GetRowResponse, InsertRowResponse, ListRowsResponse,
            UpdateRowResponse,
        },
        BoxList, BoxStr,
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
        #[error("sort column not found: {column}")]
        SortColumnNotFound { column: BoxStr },
        #[error("pagination is one based")]
        PageNumberCanNotBeZero,
        #[error("row not found")]
        RowNotFound,
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

                        let sort_info = if let Some(sort) = req.sort {
                            let col = db
                                .check_column_name(&table_name, &sort.column)
                                .await?
                                .ok_or(Self::Error::SortColumnNotFound {
                                    column: sort.column,
                                })?;
                            Some((col, sort.order))
                        } else {
                            None
                        };

                        if let Some(0) = req.page.as_ref().map(|p| p.number) {
                            return Err(Self::Error::PageNumberCanNotBeZero);
                        }

                        let rows = db
                            .list_rows(table_name, found_columns, sort_info, req.page)
                            .await?;
                        ApiResponse::ListRows(ListRowsResponse {
                            table: req.table,
                            rows,
                            request_id: req.request_id,
                        })
                    }
                    ApiRequest::GetRow(req) => {
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

                        let row = db
                            .get_row(table_name, req.key, found_columns)
                            .await?
                            .ok_or(Self::Error::RowNotFound)?;
                        ApiResponse::GetRow(GetRowResponse {
                            table: req.table,
                            row,
                            request_id: req.request_id,
                        })
                    }
                    ApiRequest::InsertRow(req) => {
                        let table_name = db.check_table_name(&req.table).await?.ok_or(
                            Self::Error::TableNotFound {
                                table: req.table.clone(),
                            },
                        )?;

                        let columns: BoxList<_> = req.data.keys().map(|k| k.to_owned()).collect();

                        let (found_columns, not_found_columns) =
                            db.check_column_names(&table_name, &columns).await?;

                        if !not_found_columns.is_empty() {
                            return Err(Self::Error::ColumnsNotFound {
                                columns: not_found_columns,
                            });
                        }

                        let row: HashMap<_, _> = req
                            .data
                            .into_iter()
                            .filter_map(|(key, value)| {
                                found_columns
                                    .iter()
                                    .find(|col| *col.as_str() == *key)
                                    .map(|col| (col.clone(), value))
                            })
                            .collect();

                        let inserted_rows = db.insert_row(table_name, row).await?;
                        ApiResponse::InsertRow(InsertRowResponse {
                            table: req.table,
                            inserted_rows,
                            request_id: req.request_id,
                        })
                    }
                    ApiRequest::DeleteRow(req) => {
                        let table_name = db.check_table_name(&req.table).await?.ok_or(
                            Self::Error::TableNotFound {
                                table: req.table.clone(),
                            },
                        )?;

                        let deleted_rows = db.delete_row(table_name, req.key).await?;
                        ApiResponse::DeleteRow(DeleteRowResponse {
                            table: req.table,
                            deleted_rows,
                            request_id: req.request_id,
                        })
                    }
                    ApiRequest::UpdateRow(req) => {
                        let table_name = db.check_table_name(&req.table).await?.ok_or(
                            Self::Error::TableNotFound {
                                table: req.table.clone(),
                            },
                        )?;

                        let columns: BoxList<_> = req.data.keys().map(|k| k.to_owned()).collect();

                        let (found_columns, not_found_columns) =
                            db.check_column_names(&table_name, &columns).await?;

                        if !not_found_columns.is_empty() {
                            return Err(Self::Error::ColumnsNotFound {
                                columns: not_found_columns,
                            });
                        }

                        let row: HashMap<_, _> = req
                            .data
                            .into_iter()
                            .filter_map(|(key, value)| {
                                found_columns
                                    .iter()
                                    .find(|col| *col.as_str() == *key)
                                    .map(|col| (col.clone(), value))
                            })
                            .collect();

                        let updated_rows = db
                            .update_row(table_name, req.key, row)
                            .await?
                            .ok_or(Self::Error::RowNotFound)?;

                        ApiResponse::UpdateRow(UpdateRowResponse {
                            table: req.table,
                            updated_rows,
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
