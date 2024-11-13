# Jabroni

Jabroni let's you connect to your SQLite database over WebSockets and query your data. Jabroni also generates a type-safe typescript client library that provides an API similar to the browser's built in `fetch`.

## Usage

Start a jabroni server

```bash
$ jabroni sample.sqlite3 serve
2024-11-13T11:29:13.776666Z  INFO jabroni::db: found 13 tables in sample.sqlite3
2024-11-13T11:29:13.776809Z  INFO jabroni: listening on: 127.0.0.1:3030
```

Start a jabroni server on a custom address

```bash
$ jabroni sample.sqlite3 serve --address 'localhost:4949
2024-11-13T11:34:21.546608Z  INFO jabroni::db: found 13 tables in sample.sqlite3
2024-11-13T11:34:21.547339Z  INFO jabroni: listening on: localhost:4949
```

Generate a jabroni client library for a database

> [!IMPORTANT]
> The jabroni client library depends on `zod` and `nanoid`, so you should have them installed in your project.

```bash
$ jabroni sample.sqlite3 generate -o jabroni.ts
2024-11-13T11:32:10.130350Z  INFO jabroni::db: found 13 tables in sample.sqlite3
2024-11-13T11:32:10.130458Z  INFO jabroni: generating client library
2024-11-13T11:32:10.133559Z  INFO jabroni: client library generated at jabroni.ts
```
