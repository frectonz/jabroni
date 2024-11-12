import { makeWebSocketFetch, nanoid, snapshotTest } from "./base.ts";

const $fetch = await makeWebSocketFetch({
  url: "ws://127.0.0.1:3030",
  connectionCount: 10,
});

Deno.test(
  "list table",
  snapshotTest($fetch, {
    type: "ListRows",
    table: "employees",
    select: [],
    request_id: nanoid(),
  }),
);

Deno.test(
  "list table with selected columns",
  snapshotTest($fetch, {
    type: "ListRows",
    table: "employees",
    select: ["FirstName"],
    request_id: nanoid(),
  }),
);

Deno.test(
  "list table with columns that don't exist",
  snapshotTest($fetch, {
    type: "ListRows",
    table: "employees",
    select: ["FirstName", "cat", "dog"],
    request_id: nanoid(),
  }),
);

Deno.test(
  "list table sorted on a column",
  snapshotTest($fetch, {
    type: "ListRows",
    table: "employees",
    select: ["FirstName", "EmployeeId"],
    sort: { column: "FirstName", order: "Asc" },
    request_id: nanoid(),
  }),
);

Deno.test(
  "list table sorted on a column that doesn't exist",
  snapshotTest($fetch, {
    type: "ListRows",
    table: "employees",
    select: ["FirstName", "EmployeeId"],
    sort: { column: "FullName", order: "Asc" },
    request_id: nanoid(),
  }),
);

Deno.test(
  "list table with pagination",
  snapshotTest($fetch, {
    type: "ListRows",
    table: "employees",
    select: ["FirstName", "EmployeeId"],
    page: { number: 2, size: 2 },
    request_id: nanoid(),
  }),
);

Deno.test(
  "list table pagination is one based",
  snapshotTest($fetch, {
    type: "ListRows",
    table: "employees",
    select: ["FirstName", "EmployeeId"],
    page: { number: 0, size: 2 },
    request_id: nanoid(),
  }),
);
