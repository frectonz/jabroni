import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";

export const Pagination = z
  .object({
    number: z.number(),
    size: z.number(),
  });

export const albums_primary_key = z.number();
export const albums_schema_optional = z.object({
  AlbumId: z.number().optional(),
  Title: z.string().optional(),
  ArtistId: z.number().optional(),
});

export const artists_primary_key = z.number();
export const artists_schema_optional = z.object({
  ArtistId: z.number().optional(),
  Name: z.string().optional(),
});

export const customers_primary_key = z.number();
export const customers_schema_optional = z.object({
  CustomerId: z.number().optional(),
  FirstName: z.string().optional(),
  LastName: z.string().optional(),
  Company: z.string().optional(),
  Address: z.string().optional(),
  City: z.string().optional(),
  State: z.string().optional(),
  Country: z.string().optional(),
  PostalCode: z.string().optional(),
  Phone: z.string().optional(),
  Fax: z.string().optional(),
  Email: z.string().optional(),
  SupportRepId: z.number().optional(),
});

export const employees_primary_key = z.number();
export const employees_schema_optional = z.object({
  EmployeeId: z.number().optional(),
  LastName: z.string().optional(),
  FirstName: z.string().optional(),
  Title: z.string().optional(),
  ReportsTo: z.number().optional(),
  BirthDate: z.string().optional(),
  HireDate: z.string().optional(),
  Address: z.string().optional(),
  City: z.string().optional(),
  State: z.string().optional(),
  Country: z.string().optional(),
  PostalCode: z.string().optional(),
  Phone: z.string().optional(),
  Fax: z.string().optional(),
  Email: z.string().optional(),
});

export const genres_primary_key = z.number();
export const genres_schema_optional = z.object({
  GenreId: z.number().optional(),
  Name: z.string().optional(),
});

export const invoices_primary_key = z.number();
export const invoices_schema_optional = z.object({
  InvoiceId: z.number().optional(),
  CustomerId: z.number().optional(),
  InvoiceDate: z.string().optional(),
  BillingAddress: z.string().optional(),
  BillingCity: z.string().optional(),
  BillingState: z.string().optional(),
  BillingCountry: z.string().optional(),
  BillingPostalCode: z.string().optional(),
  Total: z.string().optional(),
});

export const invoice_items_primary_key = z.number();
export const invoice_items_schema_optional = z.object({
  InvoiceLineId: z.number().optional(),
  InvoiceId: z.number().optional(),
  TrackId: z.number().optional(),
  UnitPrice: z.string().optional(),
  Quantity: z.number().optional(),
});

export const media_types_primary_key = z.number();
export const media_types_schema_optional = z.object({
  MediaTypeId: z.number().optional(),
  Name: z.string().optional(),
});

export const playlists_primary_key = z.number();
export const playlists_schema_optional = z.object({
  PlaylistId: z.number().optional(),
  Name: z.string().optional(),
});

export const playlist_track_primary_key = z.number();
export const playlist_track_schema_optional = z.object({
  PlaylistId: z.number().optional(),
  TrackId: z.number().optional(),
});

export const tracks_primary_key = z.number();
export const tracks_schema_optional = z.object({
  TrackId: z.number().optional(),
  Name: z.string().optional(),
  AlbumId: z.number().optional(),
  MediaTypeId: z.number().optional(),
  GenreId: z.number().optional(),
  Composer: z.string().optional(),
  Milliseconds: z.number().optional(),
  Bytes: z.number().optional(),
  UnitPrice: z.string().optional(),
});

const albums_columns = z.union([
  z.literal("AlbumId"),
  z.literal("Title"),
  z.literal("ArtistId"),
]);

export const albums_sort_options = z
  .object({
    column: albums_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const albums_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("albums"),
  select: z.array(albums_columns).default([]),
  sort: albums_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const albums_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("albums"),
  key: albums_primary_key,
  select: z.array(albums_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const artists_columns = z.union([z.literal("ArtistId"), z.literal("Name")]);

export const artists_sort_options = z
  .object({
    column: artists_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const artists_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("artists"),
  select: z.array(artists_columns).default([]),
  sort: artists_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const artists_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("artists"),
  key: artists_primary_key,
  select: z.array(artists_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const customers_columns = z.union([
  z.literal("CustomerId"),
  z.literal("FirstName"),
  z.literal("LastName"),
  z.literal("Company"),
  z.literal("Address"),
  z.literal("City"),
  z.literal("State"),
  z.literal("Country"),
  z.literal("PostalCode"),
  z.literal("Phone"),
  z.literal("Fax"),
  z.literal("Email"),
  z.literal("SupportRepId"),
]);

export const customers_sort_options = z
  .object({
    column: customers_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const customers_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("customers"),
  select: z.array(customers_columns).default([]),
  sort: customers_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const customers_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("customers"),
  key: customers_primary_key,
  select: z.array(customers_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const employees_columns = z.union([
  z.literal("EmployeeId"),
  z.literal("LastName"),
  z.literal("FirstName"),
  z.literal("Title"),
  z.literal("ReportsTo"),
  z.literal("BirthDate"),
  z.literal("HireDate"),
  z.literal("Address"),
  z.literal("City"),
  z.literal("State"),
  z.literal("Country"),
  z.literal("PostalCode"),
  z.literal("Phone"),
  z.literal("Fax"),
  z.literal("Email"),
]);

export const employees_sort_options = z
  .object({
    column: employees_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const employees_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("employees"),
  select: z.array(employees_columns).default([]),
  sort: employees_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const employees_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("employees"),
  key: employees_primary_key,
  select: z.array(employees_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const genres_columns = z.union([z.literal("GenreId"), z.literal("Name")]);

export const genres_sort_options = z
  .object({
    column: genres_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const genres_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("genres"),
  select: z.array(genres_columns).default([]),
  sort: genres_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const genres_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("genres"),
  key: genres_primary_key,
  select: z.array(genres_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const invoices_columns = z.union([
  z.literal("InvoiceId"),
  z.literal("CustomerId"),
  z.literal("InvoiceDate"),
  z.literal("BillingAddress"),
  z.literal("BillingCity"),
  z.literal("BillingState"),
  z.literal("BillingCountry"),
  z.literal("BillingPostalCode"),
  z.literal("Total"),
]);

export const invoices_sort_options = z
  .object({
    column: invoices_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const invoices_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("invoices"),
  select: z.array(invoices_columns).default([]),
  sort: invoices_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const invoices_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("invoices"),
  key: invoices_primary_key,
  select: z.array(invoices_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const invoice_items_columns = z.union([
  z.literal("InvoiceLineId"),
  z.literal("InvoiceId"),
  z.literal("TrackId"),
  z.literal("UnitPrice"),
  z.literal("Quantity"),
]);

export const invoice_items_sort_options = z
  .object({
    column: invoice_items_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const invoice_items_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("invoice_items"),
  select: z.array(invoice_items_columns).default([]),
  sort: invoice_items_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("invoice_items"),
  key: invoice_items_primary_key,
  select: z.array(invoice_items_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const media_types_columns = z.union([
  z.literal("MediaTypeId"),
  z.literal("Name"),
]);

export const media_types_sort_options = z
  .object({
    column: media_types_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const media_types_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("media_types"),
  select: z.array(media_types_columns).default([]),
  sort: media_types_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const media_types_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("media_types"),
  key: media_types_primary_key,
  select: z.array(media_types_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const playlists_columns = z.union([z.literal("PlaylistId"), z.literal("Name")]);

export const playlists_sort_options = z
  .object({
    column: playlists_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const playlists_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("playlists"),
  select: z.array(playlists_columns).default([]),
  sort: playlists_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const playlists_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("playlists"),
  key: playlists_primary_key,
  select: z.array(playlists_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const playlist_track_columns = z.union([
  z.literal("PlaylistId"),
  z.literal("TrackId"),
]);

export const playlist_track_sort_options = z
  .object({
    column: playlist_track_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const playlist_track_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("playlist_track"),
  select: z.array(playlist_track_columns).default([]),
  sort: playlist_track_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("playlist_track"),
  key: playlist_track_primary_key,
  select: z.array(playlist_track_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

const tracks_columns = z.union([
  z.literal("TrackId"),
  z.literal("Name"),
  z.literal("AlbumId"),
  z.literal("MediaTypeId"),
  z.literal("GenreId"),
  z.literal("Composer"),
  z.literal("Milliseconds"),
  z.literal("Bytes"),
  z.literal("UnitPrice"),
]);

export const tracks_sort_options = z
  .object({
    column: tracks_columns,
    order: z.enum(["Asc", "Desc"]),
  });

export const tracks_list_rows_request = z.object({
  type: z.literal("ListRows"),
  table: z.literal("tracks"),
  select: z.array(tracks_columns).default([]),
  sort: tracks_sort_options.optional(),
  page: Pagination.optional(),
  request_id: z.string().default(() => nanoid()),
});

export const tracks_get_row_request = z.object({
  type: z.literal("GetRow"),
  table: z.literal("tracks"),
  key: tracks_primary_key,
  select: z.array(tracks_columns).default([]),
  request_id: z.string().default(() => nanoid()),
});

export const ListRowsRequest = z.discriminatedUnion("table", [
  albums_list_rows_request,
  artists_list_rows_request,
  customers_list_rows_request,
  employees_list_rows_request,
  genres_list_rows_request,
  invoices_list_rows_request,
  invoice_items_list_rows_request,
  media_types_list_rows_request,
  playlists_list_rows_request,
  playlist_track_list_rows_request,
  tracks_list_rows_request,
]);
export const GetRowRequest = z.discriminatedUnion("table", [
  albums_get_row_request,
  artists_get_row_request,
  customers_get_row_request,
  employees_get_row_request,
  genres_get_row_request,
  invoices_get_row_request,
  invoice_items_get_row_request,
  media_types_get_row_request,
  playlists_get_row_request,
  playlist_track_get_row_request,
  tracks_get_row_request,
]);
export const ApiRequest = z.union([ListRowsRequest, GetRowRequest]);

export const albums_list_rows_response = z.object({
  table: z.literal("albums"),
  rows: z.array(albums_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const albums_get_row_response = z.object({
  table: z.literal("albums"),
  row: albums_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const artists_list_rows_response = z.object({
  table: z.literal("artists"),
  rows: z.array(artists_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const artists_get_row_response = z.object({
  table: z.literal("artists"),
  row: artists_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const customers_list_rows_response = z.object({
  table: z.literal("customers"),
  rows: z.array(customers_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const customers_get_row_response = z.object({
  table: z.literal("customers"),
  row: customers_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const employees_list_rows_response = z.object({
  table: z.literal("employees"),
  rows: z.array(employees_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const employees_get_row_response = z.object({
  table: z.literal("employees"),
  row: employees_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const genres_list_rows_response = z.object({
  table: z.literal("genres"),
  rows: z.array(genres_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const genres_get_row_response = z.object({
  table: z.literal("genres"),
  row: genres_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const invoices_list_rows_response = z.object({
  table: z.literal("invoices"),
  rows: z.array(invoices_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const invoices_get_row_response = z.object({
  table: z.literal("invoices"),
  row: invoices_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_list_rows_response = z.object({
  table: z.literal("invoice_items"),
  rows: z.array(invoice_items_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_get_row_response = z.object({
  table: z.literal("invoice_items"),
  row: invoice_items_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const media_types_list_rows_response = z.object({
  table: z.literal("media_types"),
  rows: z.array(media_types_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const media_types_get_row_response = z.object({
  table: z.literal("media_types"),
  row: media_types_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const playlists_list_rows_response = z.object({
  table: z.literal("playlists"),
  rows: z.array(playlists_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const playlists_get_row_response = z.object({
  table: z.literal("playlists"),
  row: playlists_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_list_rows_response = z.object({
  table: z.literal("playlist_track"),
  rows: z.array(playlist_track_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_get_row_response = z.object({
  table: z.literal("playlist_track"),
  row: playlist_track_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const tracks_list_rows_response = z.object({
  table: z.literal("tracks"),
  rows: z.array(tracks_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const tracks_get_row_response = z.object({
  table: z.literal("tracks"),
  row: tracks_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const ListRowsResponse = z.discriminatedUnion("table", [
  albums_list_rows_response,
  artists_list_rows_response,
  customers_list_rows_response,
  employees_list_rows_response,
  genres_list_rows_response,
  invoices_list_rows_response,
  invoice_items_list_rows_response,
  media_types_list_rows_response,
  playlists_list_rows_response,
  playlist_track_list_rows_response,
  tracks_list_rows_response,
]);
export const GetRowResponse = z.discriminatedUnion("table", [
  albums_get_row_response,
  artists_get_row_response,
  customers_get_row_response,
  employees_get_row_response,
  genres_get_row_response,
  invoices_get_row_response,
  invoice_items_get_row_response,
  media_types_get_row_response,
  playlists_get_row_response,
  playlist_track_get_row_response,
  tracks_get_row_response,
]);
export const ApiResponse = z.union([ListRowsResponse, GetRowResponse]);

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
