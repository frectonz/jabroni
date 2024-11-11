import { makeWebSocketFetch, nanoid, snapshotTest } from "./base.ts";

const $fetch = await makeWebSocketFetch({
  url: "ws://127.0.0.1:3030",
  connectionCount: 10,
});

Deno.test(
  "get single row",
  snapshotTest($fetch, {
    type: "GetRow",
    table: "employees",
    key: 1,
    select: [],
    request_id: nanoid(),
  }),
);

Deno.test(
  "get single row with selected columns",
  snapshotTest($fetch, {
    type: "GetRow",
    table: "employees",
    key: 1,
    select: ["Title", "FirstName", "LastName"],
    request_id: nanoid(),
  }),
);
