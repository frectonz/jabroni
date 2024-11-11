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

    const pageNumber = data.get("page_number")!;
    const pageSize = data.get("page_size")!;

    const page =
      pageNumber === "" || pageSize === ""
        ? undefined
        : {
            number: parseInt(pageNumber.toString()),
            size: parseInt(pageSize.toString()),
          };

    const req = ApiRequest.parse({
      type: "ListRows",
      table,
      select,
      sort,
      page,
    });
    mutate(req);
  }

  function getRow(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);

    const table = data.get("table");
    const key = data.get("key");

    const selectStr = data.get("select")!.toString();
    const select = selectStr === "" ? [] : selectStr.split(",");

    const req = ApiRequest.parse({ type: "GetRow", table, key, select });
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
            <input type="radio" id="order" name="order" value="Asc" />
            <label htmlFor="order">Asc</label>
            <br />
            <input type="radio" id="order" name="order" value="Desc" />
            <label htmlFor="order">Desc</label>
          </div>

          <div>
            <label htmlFor="page_number">Page Number</label>
            <input type="number" id="page_number" name="page_number" />
            <br />
            <label htmlFor="page_size">Page Size</label>
            <input type="number" id="page_size" name="page_size" />
          </div>

          <input type="submit" value="Submit" />
        </fieldset>
      </form>

      <form onSubmit={getRow}>
        <h1>Get row</h1>
        <fieldset>
          <div>
            <label htmlFor="table">Table</label>
            <input type="text" id="table" name="table" />
          </div>

          <div>
            <label htmlFor="key">Key</label>
            <input type="text" id="key" name="key" />
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
