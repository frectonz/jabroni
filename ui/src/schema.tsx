import { z } from "zod";
import { nanoid } from "nanoid";

const ListRowsRequest = z.object({
  table: z.string(),
  request_id: z.string().default(() => nanoid()),
});

export const ApiRequest = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ListRows"), ...ListRowsRequest.shape }),
]);

const ListRowsResponse = z.object({
  table: z.string(),
  rows: z.array(z.any()),
  request_id: z.string().default(() => nanoid()),
});

export const ApiResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ListRows"), ...ListRowsResponse.shape }),
]);

const ErrorMessage = z.object({
  message: z.string(),
});

const TableNotFound = z.object({
  table: z.string(),
});

export const ErrorResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("BadRequest"), ...ErrorMessage.shape }),
  z.object({ type: z.literal("NonTextMessage") }),
  z.object({ type: z.literal("TableNotFound"), ...TableNotFound.shape }),
]);
