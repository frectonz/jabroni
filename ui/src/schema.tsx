import { z } from "zod";
import { nanoid } from "nanoid";

const ListRowsRequest = z.object({
  table: z.string(),
  select: z.array(z.string()).default([]),
  sort: z
    .object({
      column: z.string(),
      order: z.enum(["Asc", "Desc"]),
    })
    .optional(),
  page: z
    .object({
      number: z.number(),
      size: z.number(),
    })
    .optional(),
  request_id: z.string().default(() => nanoid()),
});

const GetRowRequest = z.object({
  table: z.string(),
  key: z.any(),
  select: z.array(z.string()).default([]),
  request_id: z.string().default(() => nanoid()),
});

export const ApiRequest = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ListRows"), ...ListRowsRequest.shape }),
  z.object({ type: z.literal("GetRow"), ...GetRowRequest.shape }),
]);

const ListRowsResponse = z.object({
  table: z.string(),
  rows: z.array(z.any()),
  request_id: z.string().default(() => nanoid()),
});

const GetRowResponse = z.object({
  table: z.string(),
  row: z.any(),
  request_id: z.string().default(() => nanoid()),
});

export const ApiResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ListRows"), ...ListRowsResponse.shape }),
  z.object({ type: z.literal("GetRow"), ...GetRowResponse.shape }),
]);

const ErrorMessage = z.object({
  message: z.string(),
});

const TableNotFound = z.object({
  table: z.string(),
});

const ColumnsNotFound = z.object({
  columns: z.array(z.string()),
});

const SortColumnNotFound = z.object({
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
]);
