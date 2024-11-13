# Jabroni

Jabroni let's you connect to your SQLite database over WebSockets and query your data. Jabroni also generates a type-safe typescript client library that provides an API similar to the browser's built in `fetch`.

## Features

- List rows in a table.
- Select specific columns to be returned.
- Paginate results by using a page number.
- Batch insert rows.
- Create, Read, Update and Delete a single rows.
- Round robin connection pooling, to solve socket congestion.
- Type safe client library.
- All the benefits of a WebSocket connection.

## Usage

Start a jabroni server

```bash
$ jabroni sample.sqlite3 serve
2024-11-13T11:29:13.776666Z  INFO jabroni::db: found 13 tables in sample.sqlite3
2024-11-13T11:29:13.776809Z  INFO jabroni: listening on: 127.0.0.1:3030
```

Start a jabroni server on a custom address

```bash
$ jabroni sample.sqlite3 serve --address localhost:4949
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

## Client Library

Example usage of the client library

```ts
import { nanoid } from "nanoid";
import { makeWebSocketFetch } from "./jabroni.ts";

// Initialize client library
const $fetch = await makeWebSocketFetch({
  url: "ws://127.0.0.1:3030",
  connectionCount: 10,
});

// Fetch all rows and all columns in the "employees" table
const resp = $fetch({
  type: "ListRows",
  table: "employees",
  select: [],
  request_id: nanoid(),
});

// Only fetch the "FirstName" and "LastName" columns
const resp = $fetch({
  type: "ListRows",
  table: "employees",
  select: ["FirstName", "LastName"],
  request_id: nanoid(),
});

// Sort response on the "FirstName" column
const resp = $fetch({
  type: "ListRows",
  table: "employees",
  select: ["FirstName", "EmployeeId"],
  sort: { column: "FirstName", order: "Asc" },
  request_id: nanoid(),
});

// Paginate response
const resp = $fetch({
  type: "ListRows",
  table: "employees",
  page: { number: 2, size: 2 },
  request_id: nanoid(),
});

// Inset a new emplyoee in the "employees" table
const resp = $fetch({
  type: "InsertRow",
  table: "employees",
  data: {
    FirstName: "John",
    LastName: "Doe",
    Phone: "+1 (780) 428-9482",
    Email: "johndoe@test.com",
    Title: "General Manager",
    Fax: "+1 (780) 428-3457",
    Address: "11120 Jasper Ave NW",
    City: "Edmonton",
    State: "AB",
    Country: "Canada",
    BirthDate: "1962-02-18 00:00:00",
    HireDate: "2002-08-14 00:00:00",
    PostalCode: "T5K 2N1",
    ReportsTo: null,
  },
  request_id: nanoid(),
});


// ...
```
