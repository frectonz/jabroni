import { makeWebSocketFetch, nanoid, snapshotTest } from "./base.ts";

const $fetch = await makeWebSocketFetch({
  url: "ws://127.0.0.1:3030",
  connectionCount: 10,
});

Deno.test(
  "insert a row into a table",
  snapshotTest($fetch, {
    type: "InsertRow",
    table: "employees",
    data: {
      FirstName: "test",
      LastName: "tester",
      Address: "11120 Jasper Ave NW",
      BirthDate: "1962-02-18 00:00:00",
      City: "Edmonton",
      Country: "Canada",
      Email: "test@test.com",
      Fax: "+1 (780) 428-3457",
      HireDate: "2002-08-14 00:00:00",
      Phone: "+1 (780) 428-9482",
      PostalCode: "T5K 2N1",
      ReportsTo: null,
      State: "AB",
      Title: "General Manager",
    },
    request_id: nanoid(),
  }),
);

Deno.test(
  "update a row",
  snapshotTest($fetch, {
    type: "UpdateRow",
    table: "employees",
    key: 9,
    data: {
      City: "Addis",
      Country: "Ethiopia",
    },
    request_id: nanoid(),
  }),
);

Deno.test(
  "get single row",
  snapshotTest($fetch, {
    type: "GetRow",
    table: "employees",
    key: 9,
    select: ["city", "country"],
    request_id: nanoid(),
  }),
);

Deno.test(
  "delete a row from a table",
  snapshotTest($fetch, {
    type: "DeleteRow",
    table: "employees",
    key: 9,
    request_id: nanoid(),
  }),
);
