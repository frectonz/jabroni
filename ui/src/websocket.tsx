import { z } from "zod";
import { ApiRequest, ErrorResponse, ApiResponse } from "./schema";
import { nanoid } from "nanoid";

let sockets: WebSocket[] = [];
let connectionIndex = 0;

const CONNECTION_COUNT: number = 1;
const BENCHMARK_MESSAGES: number = 10;

function initWebSocketPool(): void {
  sockets = Array.from({ length: CONNECTION_COUNT }, () => {
    const socket = new WebSocket("ws://127.0.0.1:3030");

    socket.onopen = () => console.log("WebSocket connected");
    socket.onclose = () => console.log("WebSocket disconnected");
    socket.onerror = (error) => console.error("WebSocket error:", error);

    return socket;
  });
}

initWebSocketPool();

function getWebSocket(): WebSocket {
  if (sockets.length === 0) {
    throw new Error(
      "WebSocket pool is not initialized. Call initWebSocketPool first.",
    );
  }

  const socket = sockets[connectionIndex];
  connectionIndex = (connectionIndex + 1) % sockets.length;
  return socket;
}

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

export default async function benchmark() {
  const start = performance.now();

  const promises = Array.from({ length: BENCHMARK_MESSAGES }, () =>
    $fetch({ type: "ListRows", table: "employees", request_id: nanoid() }),
  );
  await Promise.all(promises);

  console.log(performance.now() - start);
}
