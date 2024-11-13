import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";

export const Pagination = z
  .object({
    number: z.number(),
    size: z.number(),
  });

export const albums_primary_key = z.number();
export const albums_schema = z.object({
  AlbumId: z.number().nullable().optional(),
  Title: z.string(),
  ArtistId: z.number(),
});

export const albums_schema_optional = z.object({
  AlbumId: z.number().nullable().optional(),
  Title: z.string().nullable().optional(),
  ArtistId: z.number().nullable().optional(),
});

export const artists_primary_key = z.number();
export const artists_schema = z.object({
  ArtistId: z.number().nullable().optional(),
  Name: z.string().nullable().optional(),
});

export const artists_schema_optional = z.object({
  ArtistId: z.number().nullable().optional(),
  Name: z.string().nullable().optional(),
});

export const customers_primary_key = z.number();
export const customers_schema = z.object({
  CustomerId: z.number().nullable().optional(),
  FirstName: z.string(),
  LastName: z.string(),
  Company: z.string().nullable().optional(),
  Address: z.string().nullable().optional(),
  City: z.string().nullable().optional(),
  State: z.string().nullable().optional(),
  Country: z.string().nullable().optional(),
  PostalCode: z.string().nullable().optional(),
  Phone: z.string().nullable().optional(),
  Fax: z.string().nullable().optional(),
  Email: z.string(),
  SupportRepId: z.number().nullable().optional(),
});

export const customers_schema_optional = z.object({
  CustomerId: z.number().nullable().optional(),
  FirstName: z.string().nullable().optional(),
  LastName: z.string().nullable().optional(),
  Company: z.string().nullable().optional(),
  Address: z.string().nullable().optional(),
  City: z.string().nullable().optional(),
  State: z.string().nullable().optional(),
  Country: z.string().nullable().optional(),
  PostalCode: z.string().nullable().optional(),
  Phone: z.string().nullable().optional(),
  Fax: z.string().nullable().optional(),
  Email: z.string().nullable().optional(),
  SupportRepId: z.number().nullable().optional(),
});

export const employees_primary_key = z.number();
export const employees_schema = z.object({
  EmployeeId: z.number().nullable().optional(),
  LastName: z.string(),
  FirstName: z.string(),
  Title: z.string().nullable().optional(),
  ReportsTo: z.number().nullable().optional(),
  BirthDate: z.string().nullable().optional(),
  HireDate: z.string().nullable().optional(),
  Address: z.string().nullable().optional(),
  City: z.string().nullable().optional(),
  State: z.string().nullable().optional(),
  Country: z.string().nullable().optional(),
  PostalCode: z.string().nullable().optional(),
  Phone: z.string().nullable().optional(),
  Fax: z.string().nullable().optional(),
  Email: z.string().nullable().optional(),
});

export const employees_schema_optional = z.object({
  EmployeeId: z.number().nullable().optional(),
  LastName: z.string().nullable().optional(),
  FirstName: z.string().nullable().optional(),
  Title: z.string().nullable().optional(),
  ReportsTo: z.number().nullable().optional(),
  BirthDate: z.string().nullable().optional(),
  HireDate: z.string().nullable().optional(),
  Address: z.string().nullable().optional(),
  City: z.string().nullable().optional(),
  State: z.string().nullable().optional(),
  Country: z.string().nullable().optional(),
  PostalCode: z.string().nullable().optional(),
  Phone: z.string().nullable().optional(),
  Fax: z.string().nullable().optional(),
  Email: z.string().nullable().optional(),
});

export const genres_primary_key = z.number();
export const genres_schema = z.object({
  GenreId: z.number().nullable().optional(),
  Name: z.string().nullable().optional(),
});

export const genres_schema_optional = z.object({
  GenreId: z.number().nullable().optional(),
  Name: z.string().nullable().optional(),
});

export const invoices_primary_key = z.number();
export const invoices_schema = z.object({
  InvoiceId: z.number().nullable().optional(),
  CustomerId: z.number(),
  InvoiceDate: z.string(),
  BillingAddress: z.string().nullable().optional(),
  BillingCity: z.string().nullable().optional(),
  BillingState: z.string().nullable().optional(),
  BillingCountry: z.string().nullable().optional(),
  BillingPostalCode: z.string().nullable().optional(),
  Total: z.string(),
});

export const invoices_schema_optional = z.object({
  InvoiceId: z.number().nullable().optional(),
  CustomerId: z.number().nullable().optional(),
  InvoiceDate: z.string().nullable().optional(),
  BillingAddress: z.string().nullable().optional(),
  BillingCity: z.string().nullable().optional(),
  BillingState: z.string().nullable().optional(),
  BillingCountry: z.string().nullable().optional(),
  BillingPostalCode: z.string().nullable().optional(),
  Total: z.string().nullable().optional(),
});

export const invoice_items_primary_key = z.number();
export const invoice_items_schema = z.object({
  InvoiceLineId: z.number().nullable().optional(),
  InvoiceId: z.number(),
  TrackId: z.number(),
  UnitPrice: z.string(),
  Quantity: z.number(),
});

export const invoice_items_schema_optional = z.object({
  InvoiceLineId: z.number().nullable().optional(),
  InvoiceId: z.number().nullable().optional(),
  TrackId: z.number().nullable().optional(),
  UnitPrice: z.string().nullable().optional(),
  Quantity: z.number().nullable().optional(),
});

export const media_types_primary_key = z.number();
export const media_types_schema = z.object({
  MediaTypeId: z.number().nullable().optional(),
  Name: z.string().nullable().optional(),
});

export const media_types_schema_optional = z.object({
  MediaTypeId: z.number().nullable().optional(),
  Name: z.string().nullable().optional(),
});

export const playlists_primary_key = z.number();
export const playlists_schema = z.object({
  PlaylistId: z.number().nullable().optional(),
  Name: z.string().nullable().optional(),
});

export const playlists_schema_optional = z.object({
  PlaylistId: z.number().nullable().optional(),
  Name: z.string().nullable().optional(),
});

export const playlist_track_primary_key = z.number();
export const playlist_track_schema = z.object({
  PlaylistId: z.number().nullable().optional(),
  TrackId: z.number().nullable().optional(),
});

export const playlist_track_schema_optional = z.object({
  PlaylistId: z.number().nullable().optional(),
  TrackId: z.number().nullable().optional(),
});

export const tracks_primary_key = z.number();
export const tracks_schema = z.object({
  TrackId: z.number().nullable().optional(),
  Name: z.string(),
  AlbumId: z.number().nullable().optional(),
  MediaTypeId: z.number(),
  GenreId: z.number().nullable().optional(),
  Composer: z.string().nullable().optional(),
  Milliseconds: z.number(),
  Bytes: z.number().nullable().optional(),
  UnitPrice: z.string(),
});

export const tracks_schema_optional = z.object({
  TrackId: z.number().nullable().optional(),
  Name: z.string().nullable().optional(),
  AlbumId: z.number().nullable().optional(),
  MediaTypeId: z.number().nullable().optional(),
  GenreId: z.number().nullable().optional(),
  Composer: z.string().nullable().optional(),
  Milliseconds: z.number().nullable().optional(),
  Bytes: z.number().nullable().optional(),
  UnitPrice: z.string().nullable().optional(),
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

export const albums_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("albums"),
  data: albums_schema,
  request_id: z.string().default(() => nanoid()),
});

export const albums_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("albums"),
  data: z.array(albums_schema),
  request_id: z.string().default(() => nanoid()),
});

export const albums_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("albums"),
  key: albums_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const albums_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("albums"),
  key: albums_primary_key,
  data: albums_schema_optional,
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

export const artists_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("artists"),
  data: artists_schema,
  request_id: z.string().default(() => nanoid()),
});

export const artists_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("artists"),
  data: z.array(artists_schema),
  request_id: z.string().default(() => nanoid()),
});

export const artists_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("artists"),
  key: artists_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const artists_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("artists"),
  key: artists_primary_key,
  data: artists_schema_optional,
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

export const customers_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("customers"),
  data: customers_schema,
  request_id: z.string().default(() => nanoid()),
});

export const customers_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("customers"),
  data: z.array(customers_schema),
  request_id: z.string().default(() => nanoid()),
});

export const customers_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("customers"),
  key: customers_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const customers_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("customers"),
  key: customers_primary_key,
  data: customers_schema_optional,
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

export const employees_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("employees"),
  data: employees_schema,
  request_id: z.string().default(() => nanoid()),
});

export const employees_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("employees"),
  data: z.array(employees_schema),
  request_id: z.string().default(() => nanoid()),
});

export const employees_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("employees"),
  key: employees_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const employees_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("employees"),
  key: employees_primary_key,
  data: employees_schema_optional,
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

export const genres_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("genres"),
  data: genres_schema,
  request_id: z.string().default(() => nanoid()),
});

export const genres_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("genres"),
  data: z.array(genres_schema),
  request_id: z.string().default(() => nanoid()),
});

export const genres_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("genres"),
  key: genres_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const genres_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("genres"),
  key: genres_primary_key,
  data: genres_schema_optional,
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

export const invoices_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("invoices"),
  data: invoices_schema,
  request_id: z.string().default(() => nanoid()),
});

export const invoices_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("invoices"),
  data: z.array(invoices_schema),
  request_id: z.string().default(() => nanoid()),
});

export const invoices_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("invoices"),
  key: invoices_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const invoices_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("invoices"),
  key: invoices_primary_key,
  data: invoices_schema_optional,
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

export const invoice_items_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("invoice_items"),
  data: invoice_items_schema,
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("invoice_items"),
  data: z.array(invoice_items_schema),
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("invoice_items"),
  key: invoice_items_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("invoice_items"),
  key: invoice_items_primary_key,
  data: invoice_items_schema_optional,
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

export const media_types_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("media_types"),
  data: media_types_schema,
  request_id: z.string().default(() => nanoid()),
});

export const media_types_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("media_types"),
  data: z.array(media_types_schema),
  request_id: z.string().default(() => nanoid()),
});

export const media_types_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("media_types"),
  key: media_types_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const media_types_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("media_types"),
  key: media_types_primary_key,
  data: media_types_schema_optional,
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

export const playlists_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("playlists"),
  data: playlists_schema,
  request_id: z.string().default(() => nanoid()),
});

export const playlists_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("playlists"),
  data: z.array(playlists_schema),
  request_id: z.string().default(() => nanoid()),
});

export const playlists_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("playlists"),
  key: playlists_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const playlists_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("playlists"),
  key: playlists_primary_key,
  data: playlists_schema_optional,
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

export const playlist_track_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("playlist_track"),
  data: playlist_track_schema,
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("playlist_track"),
  data: z.array(playlist_track_schema),
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("playlist_track"),
  key: playlist_track_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("playlist_track"),
  key: playlist_track_primary_key,
  data: playlist_track_schema_optional,
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

export const tracks_insert_row_request = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("tracks"),
  data: tracks_schema,
  request_id: z.string().default(() => nanoid()),
});

export const tracks_batch_insert_row_request = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("tracks"),
  data: z.array(tracks_schema),
  request_id: z.string().default(() => nanoid()),
});

export const tracks_delete_row_request = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("tracks"),
  key: tracks_primary_key,
  request_id: z.string().default(() => nanoid()),
});

export const tracks_update_row_request = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("tracks"),
  key: tracks_primary_key,
  data: tracks_schema_optional,
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
export const InsertRowRequest = z.discriminatedUnion("table", [
  albums_insert_row_request,
  artists_insert_row_request,
  customers_insert_row_request,
  employees_insert_row_request,
  genres_insert_row_request,
  invoices_insert_row_request,
  invoice_items_insert_row_request,
  media_types_insert_row_request,
  playlists_insert_row_request,
  playlist_track_insert_row_request,
  tracks_insert_row_request,
]);
export const BatchInsertRowRequest = z.discriminatedUnion("table", [
  albums_batch_insert_row_request,
  artists_batch_insert_row_request,
  customers_batch_insert_row_request,
  employees_batch_insert_row_request,
  genres_batch_insert_row_request,
  invoices_batch_insert_row_request,
  invoice_items_batch_insert_row_request,
  media_types_batch_insert_row_request,
  playlists_batch_insert_row_request,
  playlist_track_batch_insert_row_request,
  tracks_batch_insert_row_request,
]);
export const DeleteRowRequest = z.discriminatedUnion("table", [
  albums_delete_row_request,
  artists_delete_row_request,
  customers_delete_row_request,
  employees_delete_row_request,
  genres_delete_row_request,
  invoices_delete_row_request,
  invoice_items_delete_row_request,
  media_types_delete_row_request,
  playlists_delete_row_request,
  playlist_track_delete_row_request,
  tracks_delete_row_request,
]);
export const UpdateRowRequest = z.discriminatedUnion("table", [
  albums_update_row_request,
  artists_update_row_request,
  customers_update_row_request,
  employees_update_row_request,
  genres_update_row_request,
  invoices_update_row_request,
  invoice_items_update_row_request,
  media_types_update_row_request,
  playlists_update_row_request,
  playlist_track_update_row_request,
  tracks_update_row_request,
]);
export const ApiRequest = z.union([
  ListRowsRequest,
  GetRowRequest,
  InsertRowRequest,
  BatchInsertRowRequest,
  DeleteRowRequest,
  UpdateRowRequest,
]);

export const albums_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("albums"),
  rows: z.array(albums_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const albums_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("albums"),
  row: albums_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const albums_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("albums"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const albums_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("albums"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const albums_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("albums"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const albums_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("albums"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const artists_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("artists"),
  rows: z.array(artists_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const artists_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("artists"),
  row: artists_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const artists_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("artists"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const artists_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("artists"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const artists_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("artists"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const artists_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("artists"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const customers_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("customers"),
  rows: z.array(customers_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const customers_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("customers"),
  row: customers_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const customers_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("customers"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const customers_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("customers"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const customers_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("customers"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const customers_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("customers"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const employees_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("employees"),
  rows: z.array(employees_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const employees_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("employees"),
  row: employees_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const employees_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("employees"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const employees_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("employees"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const employees_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("employees"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const employees_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("employees"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const genres_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("genres"),
  rows: z.array(genres_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const genres_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("genres"),
  row: genres_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const genres_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("genres"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const genres_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("genres"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const genres_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("genres"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const genres_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("genres"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const invoices_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("invoices"),
  rows: z.array(invoices_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const invoices_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("invoices"),
  row: invoices_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const invoices_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("invoices"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const invoices_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("invoices"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const invoices_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("invoices"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const invoices_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("invoices"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("invoice_items"),
  rows: z.array(invoice_items_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("invoice_items"),
  row: invoice_items_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("invoice_items"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("invoice_items"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("invoice_items"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const invoice_items_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("invoice_items"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const media_types_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("media_types"),
  rows: z.array(media_types_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const media_types_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("media_types"),
  row: media_types_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const media_types_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("media_types"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const media_types_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("media_types"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const media_types_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("media_types"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const media_types_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("media_types"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const playlists_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("playlists"),
  rows: z.array(playlists_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const playlists_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("playlists"),
  row: playlists_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const playlists_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("playlists"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const playlists_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("playlists"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const playlists_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("playlists"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const playlists_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("playlists"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("playlist_track"),
  rows: z.array(playlist_track_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("playlist_track"),
  row: playlist_track_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("playlist_track"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("playlist_track"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("playlist_track"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const playlist_track_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("playlist_track"),
  updated_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const tracks_list_rows_response = z.object({
  type: z.literal("ListRows"),
  table: z.literal("tracks"),
  rows: z.array(tracks_schema_optional),
  request_id: z.string().default(() => nanoid()),
});

export const tracks_get_row_response = z.object({
  type: z.literal("GetRow"),
  table: z.literal("tracks"),
  row: tracks_schema_optional,
  request_id: z.string().default(() => nanoid()),
});

export const tracks_insert_row_response = z.object({
  type: z.literal("InsertRow"),
  table: z.literal("tracks"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const tracks_batch_insert_row_response = z.object({
  type: z.literal("BatchInsertRow"),
  table: z.literal("tracks"),
  inserted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const tracks_delete_row_response = z.object({
  type: z.literal("DeleteRow"),
  table: z.literal("tracks"),
  deleted_rows: z.number(),
  request_id: z.string().default(() => nanoid()),
});

export const tracks_update_row_response = z.object({
  type: z.literal("UpdateRow"),
  table: z.literal("tracks"),
  updated_rows: z.number(),
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
export const InsertRowResponse = z.discriminatedUnion("table", [
  albums_insert_row_response,
  artists_insert_row_response,
  customers_insert_row_response,
  employees_insert_row_response,
  genres_insert_row_response,
  invoices_insert_row_response,
  invoice_items_insert_row_response,
  media_types_insert_row_response,
  playlists_insert_row_response,
  playlist_track_insert_row_response,
  tracks_insert_row_response,
]);
export const BatchInsertRowResponse = z.discriminatedUnion("table", [
  albums_batch_insert_row_response,
  artists_batch_insert_row_response,
  customers_batch_insert_row_response,
  employees_batch_insert_row_response,
  genres_batch_insert_row_response,
  invoices_batch_insert_row_response,
  invoice_items_batch_insert_row_response,
  media_types_batch_insert_row_response,
  playlists_batch_insert_row_response,
  playlist_track_batch_insert_row_response,
  tracks_batch_insert_row_response,
]);
export const DeleteRowResponse = z.discriminatedUnion("table", [
  albums_delete_row_response,
  artists_delete_row_response,
  customers_delete_row_response,
  employees_delete_row_response,
  genres_delete_row_response,
  invoices_delete_row_response,
  invoice_items_delete_row_response,
  media_types_delete_row_response,
  playlists_delete_row_response,
  playlist_track_delete_row_response,
  tracks_delete_row_response,
]);
export const UpdateRowResponse = z.discriminatedUnion("table", [
  albums_update_row_response,
  artists_update_row_response,
  customers_update_row_response,
  employees_update_row_response,
  genres_update_row_response,
  invoices_update_row_response,
  invoice_items_update_row_response,
  media_types_update_row_response,
  playlists_update_row_response,
  playlist_track_update_row_response,
  tracks_update_row_response,
]);
export const ApiResponse = z.union([
  ListRowsResponse,
  GetRowResponse,
  InsertRowResponse,
  BatchInsertRowResponse,
  DeleteRowResponse,
  UpdateRowResponse,
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
