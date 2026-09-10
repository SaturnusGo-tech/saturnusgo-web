import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker.mjs";

const env = { FALCON_MANAGED_AUTH_ENABLED: "true", FALCON_COMPANY_DOMAIN_SUFFIX: "example.test",
  FALCON_PLATFORM_HOSTNAME: "sandbox-falcon.example.test", FALCON_API_ORIGIN: "https://api.example.test",
  FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32) };
const host = "acme-falcon.example.test";
function replaceFetch(t, value) { const original = globalThis.fetch; globalThis.fetch = value; t.after(() => { globalThis.fetch = original; }); }

test("HTML resolves an exact registered host before serving the company and never sends session cookies to Pages", async (t) => {
  const calls = [];
  replaceFetch(t, async (request) => {
    calls.push(request);
    assert.equal(request.headers.has("cookie"), false);
    if (new URL(request.url).hostname === "api.example.test") {
      assert.equal(request.headers.get("x-falcon-host"), host);
      return Response.json({ data: { hostname: host, audience: "tenant", available: true } });
    }
    return new Response("<!doctype html><html><head><title>Falcon</title></head><body>app</body></html>", {
      headers: { "content-type": "text/html", "cache-control": "public, max-age=3600", "etag": "stale", "set-cookie": "origin=secret" } });
  });
  const result = await worker.fetch(new Request(`https://${host}/admin/`, { headers: { cookie: "__Host-falcon_tenant_session=secret" } }), env);
  assert.equal(result.status, 200); assert.equal(calls.length, 2);
  assert.match(await result.text(), /<meta name="falcon-access" content="managed">/);
  assert.match(result.headers.get("cache-control"), /no-store/);
  assert.equal(result.headers.has("set-cookie"), false); assert.equal(result.headers.has("etag"), false);
  assert.doesNotMatch(result.headers.get("content-security-policy"), /auth0|api\.tms/);
});

test("unknown, retired and mismatched company hosts fail closed without loading a Pages document", async (t) => {
  let calls = 0;
  replaceFetch(t, async () => { calls++; return Response.json({ data: { hostname: "other.example.test", audience: "tenant", available: true } }); });
  const mismatch = await worker.fetch(new Request(`https://${host}/admin/`), env);
  assert.equal(mismatch.status, 503); assert.equal(calls, 1);
  replaceFetch(t, async () => new Response("not registered", { status: 404 }));
  const absent = await worker.fetch(new Request(`https://${host}/`), env);
  assert.equal(absent.status, 404); assert.match(absent.headers.get("cache-control"), /no-store/);
  assert.doesNotMatch(await absent.text(), /workspace_|Umbrella|@/);
});

test("company root directs to its workspace; the operator root directs to Sandbox; assets need no personal bootstrap", async (t) => {
  replaceFetch(t, async (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/api/v1/auth/entrypoint") {
      const hostname = request.headers.get("x-falcon-host");
      return Response.json({ data: { hostname, audience: hostname === env.FALCON_PLATFORM_HOSTNAME ? "platform" : "tenant", available: true } });
    }
    assert.equal(url.hostname, "www.saturnusgo.com");
    return new Response("asset", { headers: { "content-type": "application/javascript", "cache-control": "public, max-age=3600" } });
  });
  for (const [hostname, path] of [[host, "/testcases/umbrella-home/work/"], [env.FALCON_PLATFORM_HOSTNAME, "/sandbox/"]]) {
    const result = await worker.fetch(new Request(`https://${hostname}/`), env);
    assert.equal(result.headers.get("location"), `https://${hostname}${path}`);
  }
  const asset = await worker.fetch(new Request(`https://${host}/_next/static/app.js`), env);
  assert.equal(asset.status, 200); assert.match(asset.headers.get("cache-control"), /public/);
});
