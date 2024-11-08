import { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";

import { ApiRequest } from "./schema";
import benchmark, { $fetch, Request } from "./websocket";

function App() {
  const { data, mutate } = useMutation({
    mutationFn: (req: Request) => $fetch(req),
  });

  function calculate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    const type = data.get("type");
    const x = parseInt(data.get("x")?.toString() || "");
    const y = parseInt(data.get("y")?.toString() || "");

    const req = ApiRequest.parse({ type, x, y });
    mutate(req);
  }

  function setVar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    const name = data.get("name");
    const value = data.get("value");

    const req = ApiRequest.parse({ type: "SetVar", name, value });
    mutate(req);
  }

  function getVar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

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

      <button onClick={benchmark}>Benchmark</button>
    </>
  );
}

export default App;
