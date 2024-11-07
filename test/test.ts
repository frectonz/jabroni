import { z } from "npm:zod";
import { Input, Select } from "@cliffy/prompt";

const TwoNumsRequest = z.object({
  x: z.number().int().min(0).max(255),
  y: z.number().int().min(0).max(255),
});

const SetVarRequest = z.object({
  name: z.string(),
  value: z.string(),
});

const GetVarRequest = z.object({
  name: z.string(),
});

const ApiRequest = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Add"), ...TwoNumsRequest.shape }),
  z.object({ type: z.literal("Sub"), ...TwoNumsRequest.shape }),
  z.object({ type: z.literal("SetVar"), ...SetVarRequest.shape }),
  z.object({ type: z.literal("GetVar"), ...GetVarRequest.shape }),
]);

type ApiRequest = z.infer<typeof ApiRequest>;

async function makeRequest(): Promise<ApiRequest> {
  const type = await Select.prompt({
    message: "Select request type",
    options: [
      { name: "Add", value: "Add" },
      { name: "Sub", value: "Sub" },
      { name: "SetVar", value: "SetVar" },
      { name: "GetVar", value: "GetVar" },
    ],
  });

  if (type === "Add" || type === "Sub") {
    const x = await Input.prompt({
      message: "Enter x (0-255)",
    });
    const y = await Input.prompt({
      message: "Enter y (0-255)",
    });
    return { type, x: parseInt(x), y: parseInt(y) };
  } else if (type === "SetVar") {
    const name = await Input.prompt("Enter variable name");
    const value = await Input.prompt("Enter variable value");
    return { type, name, value };
  } else if (type === "GetVar") {
    const name = await Input.prompt("Enter variable name");
    return { type, name };
  }

  throw new Error("Invalid request type");
}

const socket = new WebSocket("ws://127.0.0.1:3030");

socket.addEventListener("open", async () => {
  console.log("connection established");

  while (true) {
    const req = await makeRequest();
    const data = JSON.stringify(req);
    socket.send(data);
  }
});

socket.addEventListener("close", () => {
  console.log("connection closed");
});

socket.addEventListener("error", (error) => {
  console.log("connection error", error);
});

socket.addEventListener("message", (event) => {
  try {
    console.log("message from server", JSON.parse(event.data));
  } catch {
    console.log("message from server", event.data);
  }
});

Deno.addSignalListener("SIGINT", () => {
  socket.close();
});
