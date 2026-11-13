import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../../../worker.mjs";

const desktop = "Mozilla/5.0 Electron/43 FalconDesktop/0.2.12";
const env = { FALCON_MANAGED_AUTH_ENABLED: "true", FALCON_COMPANY_DOMAIN_SUFFIX: "example.test",
  FALCON_PLATFORM_HOSTNAME: "sandbox-falcon.example.test", FALCON_API_ORIGIN: "https://api.example.test",
  FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32) };

function upstream(t, headers = {}) {
  const previous = globalThis.fetch, pages = [];
  t.after(() => { globalThis.fetch = previous; });
  globalThis.fetch = async request => {
    const url = new URL(request.url);
    if (url.pathname === "/api/v1/auth/entrypoint") {
      return Response.json({ data: { hostname: request.headers.get("x-falcon-host"), audience: "tenant", available: true } });
    }
    pages.push(url.pathname);
    return new Response("<html><head></head><body>marketing</body></html>", { headers: { "content-type": "text/html", ...headers } });
  };
  return pages;
}

test("Falcon desktop marketing entries return to the same workspace before loading any landing HTML", async t => {
  const pages = upstream(t);
  for (const origin of ["https://tms.saturnusgo.com", "https://acme-falcon.example.test"]) {
    for (const method of ["GET", "HEAD"]) for (const path of ["/", "/?lang=ru", "/ru", "/ru/", "/ru/?returnTo=https://evil.test&code=private"]) {
      for (const userAgent of [desktop, desktop.replace("0.2.12", "0.2.12-beta.1")]) {
        const response = await worker.fetch(new Request(origin + path, { method, headers: { "user-agent": userAgent } }), env);
        assert.equal(response.status, 302, origin + path);
        assert.equal(response.headers.get("location"), origin + "/work/");
        assert.match(response.headers.get("cache-control"), /private.*no-store/);
        assert.match(response.headers.get("vary"), /user-agent/i);
        assert.equal(await response.text(), "");
      }
    }
  }
  assert.deepEqual(pages, [], "a desktop redirect must happen before fetching marketing assets");
});

test("browser landing content and desktop legal documents keep their public routes", async t => {
  const pages = upstream(t);
  for (const [path, userAgent] of [["/", "Chrome/150"], ["/ru/", "NotFalconDesktop/0.2.12"], ["/privacy/", desktop], ["/terms/", desktop], ["/billing-terms/", desktop], ["/trial-terms/", desktop]]) {
    const response = await worker.fetch(new Request("https://tms.saturnusgo.com" + path, { headers: { "user-agent": userAgent } }), env);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("location"), null);
  }
  assert.equal(pages.length, 6);
});

test("desktop entry routing keeps managed host verification and rejects mutation requests", async t => {
  const previous = globalThis.fetch; t.after(() => { globalThis.fetch = previous; });
  globalThis.fetch = async () => new Response("unknown company", { status: 404 });
  const headers = { "user-agent": desktop };
  const missing = await worker.fetch(new Request("https://acme-falcon.example.test/ru/", { headers }), env);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get("location"), null);
  const mutation = await worker.fetch(new Request("https://tms.saturnusgo.com/ru/", { method: "POST", headers }), env);
  assert.equal(mutation.status, 404);
  assert.equal(mutation.headers.get("location"), null);
});

test("browser marketing responses vary by desktop identity while preserving upstream cache policy and variants", async t => {
  upstream(t, { "cache-control": "public, max-age=3600", vary: "Accept-Encoding, Accept-Language" });
  for (const method of ["GET", "HEAD"]) for (const path of ["/", "/?lang=ru", "/ru/"]) {
    const response = await worker.fetch(new Request("https://tms.saturnusgo.com" + path, { method, headers: { "user-agent": "Chrome/150" } }), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "public, max-age=3600");
    assert.deepEqual(response.headers.get("vary").split(",").map(value => value.trim().toLowerCase()).sort(),
      ["accept-encoding", "accept-language", "user-agent"]);
  }
  const redirect = await worker.fetch(new Request("https://tms.saturnusgo.com/ru", { headers: { "user-agent": "Chrome/150" } }), env);
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get("location"), "https://tms.saturnusgo.com/ru/");
  assert.match(redirect.headers.get("vary"), /user-agent/i);
  const legal = await worker.fetch(new Request("https://tms.saturnusgo.com/privacy/", { headers: { "user-agent": "Chrome/150" } }), env);
  assert.equal(legal.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(legal.headers.get("vary"), "Accept-Encoding, Accept-Language", "other public responses retain their own variants");
});
