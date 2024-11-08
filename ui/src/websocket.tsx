import { z } from "zod";
import { ApiRequest, ErrorResponse, ApiResponse } from "./schema";

let socket: WebSocket | undefined;
function getWebSocket() {
  if (!socket) {
    socket = new WebSocket("ws://127.0.0.1:3030");

    socket.onopen = () => console.log("WebSocket connected");
    socket.onclose = () => console.log("WebSocket disconnected");
    socket.onerror = (error) => console.error("WebSocket error:", error);
  }

  return socket;
}

getWebSocket();

export type Request = z.infer<typeof ApiRequest>;
export type Response =
  | { data: z.infer<typeof ApiResponse> }
  | { error: z.infer<typeof ErrorResponse> };

export function $fetch(request: Request): Promise<Response> {
  const socket = getWebSocket();
  const request_id = request.request_id;

  const promise = new Promise<Response>((resolve) => {
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
