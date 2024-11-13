import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assertSnapshot } from "https://deno.land/std@0.224.0/testing/snapshot.ts";
import { makeWebSocketFetch, Request } from "./jabroni.ts";

export { assertEquals, assertSnapshot, makeWebSocketFetch, nanoid };

export function snapshotTest(
  $fetch: Awaited<ReturnType<typeof makeWebSocketFetch>>,
  req: Request,
) {
  return (async (t: Deno.TestContext) => {
    const resp = await $fetch(req);

    if ("data" in resp) {
      assertEquals(resp.data.request_id, req.request_id);
      resp.data.request_id = "";
    }
    await assertSnapshot(t, resp);
  });
}
