import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../../../worker.mjs";

const path = "/falcon/desktop/beta/latest.json";
const key = path.slice(1);
const release = version => ({ version, channel: "beta", baseUrl: `https://saturnusgo.com/falcon/desktop/beta/${version}/`, artifacts: [] });
const object = value => ({ size: Buffer.byteLength(value), text: async () => value });
const request = (method = "GET", host = "tms.saturnusgo.com") => new Request(`https://${host}${path}`, { method });

test("desktop update reads the latest pointer directly instead of a cached Pages document", async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  let originRequests = 0, current = "0.2.11";
  globalThis.fetch = async () => { originRequests++; return Response.json(release("0.2.10")); };
  const keys = [], env = { DOCS_AUDIO: { async get(value) { keys.push(value); return object(JSON.stringify(release(current))); } } };
  const first = await worker.fetch(request(), env);
  assert.equal((await first.json()).version, "0.2.11");
  current = "0.2.12";
  assert.equal((await (await worker.fetch(request(), env)).json()).version, "0.2.12");
  assert.deepEqual(keys, [key, key]); assert.equal(originRequests, 0);
  assert.equal(first.headers.get("cache-control"), "private, no-store, no-transform");
  assert.equal(first.headers.get("x-content-type-options"), "nosniff");
  assert.equal(first.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(first.headers.has("set-cookie"), false); assert.equal(first.headers.has("etag"), false);
});

test("desktop latest supports HEAD and ignores stale conditional and range headers", async () => {
  const env = { DOCS_AUDIO: { get: async () => object(JSON.stringify(release("0.2.11"))) } };
  const head = await worker.fetch(request("HEAD"), env);
  assert.equal(head.status, 200); assert.equal(await head.text(), "");
  const get = await worker.fetch(new Request(`https://tms.saturnusgo.com${path}`, {
    headers: { "if-none-match": '"old"', range: "bytes=0-2", cookie: "session=private", authorization: "Bearer private" },
  }), env);
  assert.equal(get.status, 200); assert.equal((await get.json()).version, "0.2.11");
});

test("tenant workspaces receive the same latest release without requiring a product session", async () => {
  const env = { FALCON_MANAGED_AUTH_ENABLED: "true", FALCON_COMPANY_DOMAIN_SUFFIX: "example.test", FALCON_PLATFORM_HOSTNAME: "sandbox-falcon.example.test",
    DOCS_AUDIO: { get: async () => object(JSON.stringify(release("0.2.11"))) } };
  const response = await worker.fetch(request("GET", "acme-falcon.example.test"), env);
  assert.equal(response.status, 200); assert.equal((await response.json()).version, "0.2.11");
  assert.equal((await worker.fetch(request("GET", "untrusted.example.test"), env)).status, 404);
});

test("an unavailable latest pointer fails closed instead of offering an older bundled installer", async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  let originRequests = 0;
  globalThis.fetch = async () => { originRequests++; return Response.json(release("0.2.10")); };
  for (const bucket of [undefined, { get: async () => null }, { get: async () => { throw new Error("offline"); } },
    { get: async () => object("<html>error</html>") }, { get: async () => object("[]") },
    { get: async () => ({ size: 70_000, text: () => { throw new Error("Do not read oversized data"); } }) }]) {
    const result = await worker.fetch(request(), { DOCS_AUDIO: bucket });
    assert.equal(result.status, 503); assert.match(result.headers.get("cache-control"), /no-store/);
  }
  assert.equal(originRequests, 0);
});

test("latest pointer is read-only", async () => {
  let reads = 0;
  const response = await worker.fetch(request("POST"), { DOCS_AUDIO: { get: async () => { reads++; } } });
  assert.equal(response.status, 405); assert.equal(response.headers.get("allow"), "GET, HEAD"); assert.equal(reads, 0);
});
