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
  const preferencesHtml = html.replace("<body>workspace", "<body>notification preferences");
  for (const [path, content] of [
    ["work/index.html", html],
    ["work/index.txt", "route-data"],
    ["tms-origin/work/notification-preferences/index.html", preferencesHtml],
    ["tms-origin/work/notification-preferences/index.txt", "notification-preferences-data"],
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
  const assetRequests = [];
  const FALCON_STATIC_ASSETS = { fetch: (request) => {
    assetRequests.push(request);
    return bindings.FALCON_STATIC_ASSETS.fetch(request.url, {
      method: request.method, headers: Object.fromEntries(request.headers), redirect: "manual",
    });
  } };
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
  const response = await worker.fetch(new Request("https://acme-falcon.example.test/work/?code=private&state=private"), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<meta name="falcon-access" content="managed">/);
  assert.equal(response.headers.get("cache-control"), "private, no-store, no-transform");
  for (const [hostname, configuration, managed] of [
    ["tms.saturnusgo.com", { FALCON_STATIC_ASSETS }, false],
    ["acme-falcon.example.test", env, true],
  ]) {
    const address = `https://${hostname}/work/notification-preferences/`;
    const preferences = await worker.fetch(new Request(`${address}?workspaceId=space&code=private&state=private`, {
      headers: { cookie: "__Host-falcon_tenant_session=private", authorization: "Bearer private" },
    }), configuration);
    assert.equal(preferences.status, 200);
    const body = await preferences.text();
    assert.match(body, /<body>notification preferences/);
    assert.equal(body.includes('<meta name="falcon-access" content="managed">'), managed);
    assert.equal(preferences.headers.get("x-robots-tag"), "noindex, nofollow");
    if (managed) assert.equal(preferences.headers.get("cache-control"), "private, no-store, no-transform");
    const forwarded = assetRequests[assetRequests.length - 1];
    assert.equal(forwarded.url, "https://www.saturnusgo.com/tms-origin/work/notification-preferences/index.html?workspaceId=space");
    assert.equal(forwarded.headers.has("cookie"), false);
    assert.equal(forwarded.headers.has("authorization"), false);
    const head = await worker.fetch(new Request(`${address}?workspaceId=space`, { method: "HEAD" }), configuration);
    assert.equal(head.status, 200); assert.equal(await head.text(), "");
    const data = await worker.fetch(new Request(`${address}index.txt?_rsc=fixture`), configuration);
    assert.equal(data.status, 200); assert.equal(await data.text(), "notification-preferences-data");
    const canonical = await worker.fetch(new Request(`${address.slice(0, -1)}?workspaceId=space`), configuration);
    assert.equal(canonical.status, 302); assert.equal(canonical.headers.get("location"), `${address}?workspaceId=space`);
    const requestsBeforeRejection = assetRequests.length;
    for (const [path, method] of [["work/notification-preferences/extra", "GET"],
      ["tms-origin/work/notification-preferences/index.html", "GET"], ["work/notification-preferences/", "POST"]]) {
      assert.equal((await worker.fetch(new Request(`https://${hostname}/${path}`, { method }), configuration)).status, 404);
    }
    assert.equal(assetRequests.length, requestsBeforeRejection, "unapproved paths and writes must not reach static storage");
  }
  for (const [url, expected] of [
    ["https://admin.example.test/sandbox/", 200],
    ["https://acme-falcon.example.test/work/index.txt", 200],
    ["https://acme-falcon.example.test/_next/static/app.js", 200],
    ["https://acme-falcon.example.test/tms-origin/sandbox/index.html", 404],
  ]) assert.equal((await worker.fetch(new Request(url), env)).status, expected);
});
