import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../../worker.mjs";
import { requiredPublicAssets } from "../../route-manifest.mjs";

test("every documentation font is a required, published Falcon asset served by the production Worker", async (context) => {
  const repository = new URL("../../../../../", import.meta.url);
  const css = await readFile(new URL("app/src/modules/core-tms/documentation/presentation/documentation.module.css", repository), "utf8");
  const paths = [...css.matchAll(/url\("([^"]+\.woff2)"\)/g)].map((match) => match[1]);
  assert.equal(paths.length, 5);
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  for (const path of paths) {
    assert.ok(path.startsWith("/falcon/"), `${path} must use the published Falcon asset directory`);
    assert.ok(requiredPublicAssets.includes(path), `${path} must be checked before publishing`);
    const bytes = await readFile(new URL(`public${path}`, repository));
    assert.equal(bytes.toString("ascii", 0, 4), "wOF2");
    globalThis.fetch = async (request) => {
      assert.equal(request.url, `https://www.saturnusgo.com${path}`);
      return new Response(bytes, { headers: { "content-type": "font/woff2" } });
    };
    const response = await worker.fetch(new Request(`https://tms.saturnusgo.com${path}`));
    assert.equal(response.status, 200);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(bytes));
  }
});
