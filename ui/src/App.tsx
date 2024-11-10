import { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";

import { ApiRequest } from "./schema";
import benchmark, { $fetch, Request } from "./websocket";

function App() {
  const { data, mutate } = useMutation({
    mutationFn: (req: Request) => $fetch(req),
  });

  function listRows(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    const table = data.get("table");
    const selectStr = data.get("select")!.toString();
    const select = selectStr === "" ? [] : selectStr.split(",");

    const req = ApiRequest.parse({ type: "ListRows", table, select });
    mutate(req);
  }

  return (
    <>
      <h1>Result</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <form onSubmit={listRows}>
        <h1>List rows</h1>
        <fieldset>
          <div>
            <label htmlFor="table">Table</label>
            <input type="text" id="table" name="table" />
          </div>

          <div>
            <label htmlFor="select">Select</label>
            <input type="text" id="select" name="select" />
          </div>

          <input type="submit" value="Submit" />
        </fieldset>
      </form>

      <button onClick={benchmark}>Benchmark</button>
    </>
  );
}

export default App;
