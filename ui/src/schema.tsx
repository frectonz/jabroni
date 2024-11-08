import { z } from "zod";
import { nanoid } from "nanoid";

const TwoNumsRequest = z.object({
  x: z.number().int().min(0).max(255),
  y: z.number().int().min(0).max(255),
  request_id: z.string().default(nanoid()),
});

const SetVarRequest = z.object({
  name: z.string(),
  value: z.string(),
  request_id: z.string().default(nanoid()),
});

const GetVarRequest = z.object({
  name: z.string(),
  request_id: z.string().default(nanoid()),
});

export const ApiRequest = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Add"), ...TwoNumsRequest.shape }),
  z.object({ type: z.literal("Sub"), ...TwoNumsRequest.shape }),
  z.object({ type: z.literal("SetVar"), ...SetVarRequest.shape }),
  z.object({ type: z.literal("GetVar"), ...GetVarRequest.shape }),
]);

const OpResult = z.object({
  result: z.number().int().min(0).max(255),
  request_id: z.string(),
});

const VarResult = z.object({
  name: z.string(),
  value: z.string(),
  request_id: z.string(),
});

export const ApiResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Add"), ...OpResult.shape }),
  z.object({ type: z.literal("Sub"), ...OpResult.shape }),
  z.object({ type: z.literal("SetVar"), ...VarResult.shape }),
  z.object({ type: z.literal("GetVar"), ...VarResult.shape }),
]);

const ErrorMessage = z.object({
  message: z.string(),
});

const Value = z.object({
  name: z.string(),
});

export const ErrorResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("BadRequest"), ...ErrorMessage.shape }),
  z.object({ type: z.literal("NonTextMessage") }),
  z.object({ type: z.literal("FailedToGetLock") }),
  z.object({ type: z.literal("NoValueFound"), ...Value.shape }),
]);
