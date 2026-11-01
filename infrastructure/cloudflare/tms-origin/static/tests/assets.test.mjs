import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../worker.mjs";

test("an isolated asset binding serves the reviewed build without a public origin fetch", async (context) => {
  const previous = globalThis.fetch;
  context.after(() => { globalThis.fetch = previous; });
  globalThis.fetch = async () => { throw new Error("The public origin must not be used"); };
  const env = { FALCON_STATIC_ASSETS: { async fetch(request) {
    assert.equal(new URL(request.url).pathname, "/_next/static/app.js");
    assert.equal(request.headers.has("cookie"), false);
    assert.equal(request.headers.has("authorization"), false);
    return new Response("export const pilot = true", { headers: { "content-type": "application/javascript" } });
  } } };
  const response = await worker.fetch(new Request("https://tms.saturnusgo.com/_next/static/app.js", {
    headers: { cookie: "private=1", authorization: "Bearer private" },
  }), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "export const pilot = true");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("an isolated asset miss stays local instead of falling back to production", async (context) => {
  const previous = globalThis.fetch;
  context.after(() => { globalThis.fetch = previous; });
  globalThis.fetch = async () => { throw new Error("The public origin must not be used"); };
  const response = await worker.fetch(new Request("https://tms.saturnusgo.com/_next/static/missing.js"), {
    FALCON_STATIC_ASSETS: { fetch: async () => new Response("Missing", { status: 404 }) },
  });
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not found");
});

test("Codex marks are allowed without exposing unrelated assets", async () => {
  const served = [];
  const env = { FALCON_MANAGED_AUTH_ENABLED: "true", FALCON_COMPANY_DOMAIN_SUFFIX: "saturnusgo.com",
    FALCON_PLATFORM_HOSTNAME: "codex-lab-admin.saturnusgo.com", FALCON_STATIC_ASSETS: { fetch: async (request) => {
    served.push(new URL(request.url).pathname);
    return new Response("png", { headers: { "content-type": "image/png" } });
  } } };
  for (const theme of ["light", "dark"]) {
    const path = `/assets/integrations/codex/codex-${theme}.png`;
    assert.equal((await worker.fetch(new Request(`https://codex-lab-falcon.saturnusgo.com${path}`), env)).status, 200);
  }
  for (const path of ["/assets/private.png", "/assets/integrations/other/logo.png", "/tms-origin/assets/integrations/codex/codex-light.png"]) {
    assert.equal((await worker.fetch(new Request(`https://codex-lab-falcon.saturnusgo.com${path}`), env)).status, 404);
  }
  assert.deepEqual(served, ["/assets/integrations/codex/codex-light.png", "/assets/integrations/codex/codex-dark.png"]);
});
