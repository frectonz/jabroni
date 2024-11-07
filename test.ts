const socket = new WebSocket("ws://127.0.0.1:3030");

socket.addEventListener("open", () => {
  console.log("connection established");

  const setVar = { type: "SetVar", name: "hello", value: "world" };
  console.log("sending data", setVar);
  socket.send(JSON.stringify(setVar));

  const getVar = { type: "GetVar", name: "hellox" };
  console.log("sending data", setVar);
  socket.send(JSON.stringify(getVar));
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
