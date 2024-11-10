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

    const order = data.get("order");
    const sortColumn = data.get("sort");

    const sort = sortColumn === "" ? undefined : { column: sortColumn, order };

    const req = ApiRequest.parse({ type: "ListRows", table, select, sort });
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

          <div>
            <label htmlFor="sort">Sort</label>
            <input type="text" id="sort" name="sort" />
          </div>

          <div>
            <input checked type="radio" id="order" name="order" value="Asc" />
            <label htmlFor="order">Asc</label>
            <br />
            <input type="radio" id="order" name="order" value="Desc" />
            <label htmlFor="order">Desc</label>
            <br />
          </div>

          <input type="submit" value="Submit" />
        </fieldset>
      </form>

      <button onClick={benchmark}>Benchmark</button>
    </>
  );
}

export default App;
