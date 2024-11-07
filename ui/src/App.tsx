import { FormEvent } from "react";

import { z } from "zod";
import { nanoid } from "nanoid";
import { useMutation } from "@tanstack/react-query";

let socket: WebSocket | undefined;
export function useWebSocket() {
  if (!socket) {
    socket = new WebSocket("ws://127.0.0.1:3030");

    socket.onopen = () => console.log("WebSocket connected");
    socket.onclose = () => console.log("WebSocket disconnected");
    socket.onerror = (error) => console.error("WebSocket error:", error);
  }

  return socket;
}

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

const ApiRequest = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Add"), ...TwoNumsRequest.shape }),
  z.object({ type: z.literal("Sub"), ...TwoNumsRequest.shape }),
  z.object({ type: z.literal("SetVar"), ...SetVarRequest.shape }),
  z.object({ type: z.literal("GetVar"), ...GetVarRequest.shape }),
]);

type ApiRequest = z.infer<typeof ApiRequest>;

const OpResult = z.object({
  result: z.number().int().min(0).max(255),
  request_id: z.string(),
});

const VarResult = z.object({
  name: z.string(),
  value: z.string(),
  request_id: z.string(),
});

const ApiResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Add"), ...OpResult.shape }),
  z.object({ type: z.literal("Sub"), ...OpResult.shape }),
  z.object({ type: z.literal("SetVar"), ...VarResult.shape }),
  z.object({ type: z.literal("GetVar"), ...VarResult.shape }),
]);

const ErrorMessage = z.object({
  message: z.string(),
});

const ErrorResponse = z.discriminatedUnion("type", [
  z.object({ type: z.literal("BadRequest"), ...ErrorMessage.shape }),
  z.object({ type: z.literal("NonTextMessage") }),
]);

type ApiResponse = z.infer<typeof ApiResponse>;
type ApiErrorResponse = z.infer<typeof ErrorResponse>;
type Response = { data: ApiResponse } | { error: ApiErrorResponse };

function $fetch(socket: WebSocket, request: ApiRequest): Promise<Response> {
  const request_id = request.request_id;

  const promise = new Promise<Response>((resolve, _) => {
    function handleMessage(event: MessageEvent<string>) {
      const error = ErrorResponse.safeParse(JSON.parse(event.data));
      if (error.data) {
        socket.removeEventListener("message", handleMessage);
        return resolve({ error: error.data });
      }

      const resp = ApiResponse.safeParse(JSON.parse(event.data));
      if (resp.data && resp.data.request_id == request_id) {
        socket.removeEventListener("message", handleMessage);
        return resolve({ data: resp.data });
      }
    }

    socket.addEventListener("message", handleMessage);
  });

  socket.send(JSON.stringify({ ...request, request_id }));
  return promise;
}

function App() {
  const socket = useWebSocket();
  const { data, mutate } = useMutation({
    mutationFn: (req: ApiRequest) => $fetch(socket, req),
  });

  function calculate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let data = new FormData(e.target as HTMLFormElement);

    const type = data.get("type");
    const x = parseInt(data.get("x")?.toString() || "");
    const y = parseInt(data.get("y")?.toString() || "");

    const req = ApiRequest.parse({ type, x, y });
    mutate(req);
  }

  function setVar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let data = new FormData(e.target as HTMLFormElement);

    const name = data.get("name");
    const value = data.get("value");

    const req = ApiRequest.parse({ type: "SetVar", name, value });
    mutate(req);
  }

  function getVar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let data = new FormData(e.target as HTMLFormElement);

    const name = data.get("name");

    const req = ApiRequest.parse({ type: "GetVar", name });
    mutate(req);
  }

  return (
    <>
      <h1>Result</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <form onSubmit={calculate}>
        <fieldset>
          <div>
            <label htmlFor="x">X</label>
            <input type="number" id="x" name="x" />
          </div>

          <div>
            <label htmlFor="y">Y</label>
            <input type="number" id="y" name="y" />
            <br />
          </div>

          <input type="radio" id="add" name="type" value="Add" />
          <label htmlFor="add">Add</label>
          <br />

          <input type="radio" id="sub" name="type" value="Sub" />
          <label htmlFor="sub">Sub</label>
          <br />

          <input type="submit" value="Calculate" />
        </fieldset>
      </form>

      <form onSubmit={setVar}>
        <fieldset>
          <div>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" />
          </div>

          <div>
            <label htmlFor="value">Value</label>
            <input type="text" id="value" name="value" />
          </div>

          <input type="submit" value="Set Var" />
        </fieldset>
      </form>

      <form onSubmit={getVar}>
        <fieldset>
          <div>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" />
          </div>

          <input type="submit" value="Get Var" />
        </fieldset>
      </form>
    </>
  );
}

export default App;
