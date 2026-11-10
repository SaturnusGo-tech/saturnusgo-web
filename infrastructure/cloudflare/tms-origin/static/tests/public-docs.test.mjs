import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../worker.mjs";
import { publicRoutes } from "../../route-manifest.mjs";

test("anonymous documentation and support routes serve isolated static artifacts in both languages", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  for (const path of ["/docs/", "/ru/docs/", "/contact-support/", "/ru/contact-support/"]) {
    const route = publicRoutes.find(route => route.publicPath === path);
    assert.ok(route?.required, `${path} must be staged and verified at release`);
    globalThis.fetch = async (request) => {
      assert.equal(request.url, `https://www.saturnusgo.com/tms-origin${path}index.html`);
      assert.equal(request.headers.get("authorization"), null);
      return new Response("<!doctype html><title>Falcon Docs</title>", { headers: { "content-type": "text/html" } });
    };
    const response = await worker.fetch(new Request(`https://tms.saturnusgo.com${path}`));
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Falcon Docs/);
    const canonical = await worker.fetch(new Request(`https://tms.saturnusgo.com${path.slice(0, -1)}`));
    assert.equal(canonical.status, 302);
    assert.equal(canonical.headers.get("location"), `https://tms.saturnusgo.com${path}`);
  }
});
