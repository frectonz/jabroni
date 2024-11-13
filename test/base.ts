import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assertSnapshot } from "https://deno.land/std@0.224.0/testing/snapshot.ts";

export { assertEquals, assertSnapshot, nanoid };

export const SortOptions = z
  .object({
    column: z.string(),
    order: z.enum(["Asc", "Desc"]),
  });

export const Pagination = z
  .object({
    number: z.number(),
    size: z.number(),
  });

export const ListRowsRequest = z.object({
  table: z.string(),
  select: z.array(z.string()).default([]),
  sort: SortOptions.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const GetRowRequest = z.object({
  table: z.string(),
  key: z.any(),
  select: z.array(z.string()).default([]),
  request_id: z.string().default(() => nanoid()),
});

export const InsertRowRequest = z.object({
  table: z.string(),
  data: z.any(),
  request_id: z.string().default(() => nanoid()),
});

export const DeleteRowRequest = z.object({
  table: z.string(),
  key: z.any(),
  request_id: z.string().default(() => nanoid()),
});

export const UpdateRowRequest = z.object({
  table: z.string(),
  key: z.any(),
  data: z.any(),
  request_id: z.string().default(() => nanoid()),
});

export const BatchInsertRowRequest = z.object({
  table: z.string(),
  key: z.any(),
  data: z.any(),
  request_id: z.string().default(() => nanoid()),
});

export const ApiRequest = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ListRows"), ...ListRowsRequest.shape }),
  z.object({ type: z.literal("GetRow"), ...GetRowRequest.shape }),
  z.object({ type: z.literal("InsertRow"), ...InsertRowRequest.shape }),
  z.object({ type: z.literal("DeleteRow"), ...DeleteRowRequest.shape }),
  z.object({ type: z.literal("UpdateRow"), ...UpdateRowRequest.shape }),
  z.object({
    type: z.literal("BatchInsertRow"),
    ...BatchInsertRowRequest.shape,
  }),
]);

export const ListRowsResponse = z.object({
  table: z.string(),
  rows: z.array(z.any()),
  request_id: z.string().default(() => nanoid()),
});

export const GetRowResponse = z.object({
  table: z.string(),
  row: z.any(),
  request_id: z.string().default(() => nanoid()),
});

export const InsertRowResponse = z.object({
  table: z.string(),
  inserted_rows: z.any(),
  request_id: z.string().default(() => nanoid()),
});

export const DeleteRowResponse = z.object({
  table: z.string(),
  deleted_rows: z.any(),
  request_id: z.string().default(() => nanoid()),
});

export const UpdateRowResponse = z.object({
  table: z.string(),
  updated_rows: z.any(),
  request_id: z.string().default(() => nanoid()),
});

export const ApiResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ListRows"), ...ListRowsResponse.shape }),
  z.object({ type: z.literal("GetRow"), ...GetRowResponse.shape }),
  z.object({ type: z.literal("InsertRow"), ...InsertRowResponse.shape }),
  z.object({ type: z.literal("DeleteRow"), ...DeleteRowResponse.shape }),
  z.object({ type: z.literal("UpdateRow"), ...UpdateRowResponse.shape }),
  z.object({ type: z.literal("BatchInsertRow"), ...InsertRowResponse.shape }),
]);

export const ErrorMessage = z.object({
  message: z.string(),
});

export const TableNotFound = z.object({
  table: z.string(),
});

export const ColumnsNotFound = z.object({
  columns: z.array(z.string()),
});

export const SortColumnNotFound = z.object({
  column: z.string(),
});

export const ErrorResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("BadRequest"), ...ErrorMessage.shape }),
  z.object({ type: z.literal("NonTextMessage") }),
  z.object({ type: z.literal("TableNotFound"), ...TableNotFound.shape }),
  z.object({ type: z.literal("ColumnsNotFound"), ...ColumnsNotFound.shape }),
  z.object({
    type: z.literal("SortColumnNotFound"),
    ...SortColumnNotFound.shape,
  }),
  z.object({ type: z.literal("PageNumberCanNotBeZero") }),
  z.object({ type: z.literal("RowNotFound") }),
  z.object({ type: z.literal("DatabaseError") }),
]);

export type MakeFetchOptions = {
  url: string;
  connectionCount: number;
};

export type Request = z.infer<typeof ApiRequest>;
export type Response =
  | { data: z.infer<typeof ApiResponse> }
  | { error: z.infer<typeof ErrorResponse> };

export async function makeWebSocketFetch(
  { url, connectionCount }: MakeFetchOptions,
) {
  let sockets: WebSocket[] = [];
  let connectionIndex = 0;
  const openPromises: (Promise<void>)[] = [];

  sockets = new Array(connectionCount).fill(0).map((_, i) => {
    const socket = new WebSocket(url);

    openPromises.push(
      new Promise((res) => {
        socket.onopen = () => {
          res();
        };
      }),
    );

    socket.onclose = () => console.log(i, "WebSocket disconnected");
    socket.onerror = (error) => console.error(i, "WebSocket error:", error);

    return socket;
  });

  await Promise.all(openPromises);

  function getWebSocket(): WebSocket {
    if (sockets.length === 0) {
      throw new Error(
        "WebSocket pool is not initialized.",
      );
    }

    const socket = sockets[connectionIndex];
    connectionIndex = (connectionIndex + 1) % sockets.length;
    return socket;
  }

  function $fetch(request: Request): Promise<Response> {
    const socket = getWebSocket();
    const request_id = request.request_id;

    const promise = new Promise<Response>((resolve) => {
      function handleMessage(event: MessageEvent<string>) {
        const error = ErrorResponse.safeParse(JSON.parse(event.data));
        if (error.data) {
          socket.removeEventListener("message", handleMessage);
          return resolve({ error: error.data });
        }

        const resp = ApiResponse.parse(JSON.parse(event.data));
        socket.removeEventListener("message", handleMessage);
        return resolve({ data: resp });
      }

      socket.addEventListener("message", handleMessage);
    });

    socket.send(JSON.stringify({ ...request, request_id }));
    return promise;
  }

  return $fetch;
}

export function snapshotTest(
  $fetch: Awaited<ReturnType<typeof makeWebSocketFetch>>,
  req: Request,
) {
  return (async (t: Deno.TestContext) => {
    const resp = await $fetch(req);

    if ("data" in resp) {
      assertEquals(resp.data.request_id, req.request_id);
      resp.data.request_id = "";
    }
    await assertSnapshot(t, resp);
  });
}
