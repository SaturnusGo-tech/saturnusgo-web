import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import worker from "../../worker.mjs";

test("a managed workspace directory serves its HTML through the real exact-file asset binding", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "falcon-static-document-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const html = "<!doctype html><html><head><title>Falcon</title></head><body>workspace</body></html>";
  for (const [path, content] of [
    ["testcases/umbrella-home/work/index.html", html],
    ["testcases/umbrella-home/work/index.txt", "route-data"],
    ["tms-origin/sandbox/index.html", html],
    ["_next/static/app.js", "export const workspace = true;"],
  ]) {
    await mkdir(join(directory, path, ".."), { recursive: true });
    await writeFile(join(directory, path), content);
  }
  const runtime = new Miniflare(convertV4MiniflareOptions({ workers: [{ name: "lab",
    modules: true, compatibilityDate: "2026-08-28",
    script: "export default { fetch(request, env) { return env.FALCON_STATIC_ASSETS.fetch(request); } }",
    assets: { directory, binding: "FALCON_STATIC_ASSETS", run_worker_first: true,
      assetConfig: { html_handling: "none", not_found_handling: "none" } },
  }] }));
  context.after(() => runtime.dispose());
  const bindings = await runtime.getBindings();
  const FALCON_STATIC_ASSETS = { fetch: (request) => bindings.FALCON_STATIC_ASSETS.fetch(request.url, {
    method: request.method, headers: Object.fromEntries(request.headers), redirect: "manual",
  }) };
  const previous = globalThis.fetch;
  context.after(() => { globalThis.fetch = previous; });
  globalThis.fetch = async (request) => {
    assert.equal(new URL(request.url).origin, "https://api.example.test");
    const hostname = request.headers.get("x-falcon-host");
    return Response.json({ data: { hostname, audience: hostname.startsWith("admin.") ? "platform" : "tenant", available: true } });
  };
  const env = { FALCON_STATIC_ASSETS, FALCON_MANAGED_AUTH_ENABLED: "true",
    FALCON_COMPANY_DOMAIN_SUFFIX: "example.test", FALCON_PLATFORM_HOSTNAME: "admin.example.test",
    FALCON_API_ORIGIN: "https://api.example.test", FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32) };
  const response = await worker.fetch(new Request("https://acme-falcon.example.test/testcases/umbrella-home/work/?code=private&state=private"), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<meta name="falcon-access" content="managed">/);
  assert.equal(response.headers.get("cache-control"), "private, no-store, no-transform");
  for (const [url, expected] of [
    ["https://admin.example.test/sandbox/", 200],
    ["https://acme-falcon.example.test/testcases/umbrella-home/work/index.txt", 200],
    ["https://acme-falcon.example.test/_next/static/app.js", 200],
    ["https://acme-falcon.example.test/tms-origin/sandbox/index.html", 404],
  ]) assert.equal((await worker.fetch(new Request(url), env)).status, expected);
});
