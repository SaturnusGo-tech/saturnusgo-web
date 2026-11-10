import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import test from "node:test";
import { TMS_HOST } from "../../../route-manifest.mjs";
import worker from "../../../worker.mjs";
import { PUBLIC_SUPPORT_PATH } from "../../protocol/route-policy.mjs";

test("public support forwards an anonymous signed submission on the public Falcon host", async (context) => {
  const origin = `https://${TMS_HOST}`;
  const url = `${origin}${PUBLIC_SUPPORT_PATH}`;
  const env = {
    FALCON_PUBLIC_AUTH_ENABLED: "false",
    FALCON_MANAGED_AUTH_ENABLED: "true",
    FALCON_COMPANY_DOMAIN_SUFFIX: "saturnusgo.com",
    FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32),
    FALCON_API_ORIGIN: "https://api.example.test",
  };
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  const body = new FormData();
  body.append("email", "qa@example.test");
  body.append("message", "Public documentation question");
  const clientIp = "192.0.2.1";
  let calls = 0;
  globalThis.fetch = async (request) => {
    calls++;
    assert.equal(request.url, `${env.FALCON_API_ORIGIN}${PUBLIC_SUPPORT_PATH}`);
    assert.equal(request.headers.get("cookie"), null);
    assert.equal(request.headers.get("authorization"), null);
    assert.equal(request.headers.get("x-falcon-client-ip"), clientIp);
    const bytes = Buffer.from(await request.clone().arrayBuffer());
    const digest = (value) => createHash("sha256").update(value).digest("hex");
    const canonical = JSON.stringify(["falcon-gateway-v1", "POST", PUBLIC_SUPPORT_PATH, TMS_HOST,
      request.headers.get("x-falcon-time"), clientIp, origin, digest(""), digest(bytes)]);
    assert.equal(request.headers.get("x-falcon-signature"), createHmac("sha256",
      Buffer.from(env.FALCON_MANAGED_GATEWAY_KEY, "hex")).update(canonical).digest("hex"));
    assert.equal((await request.formData()).get("message"), body.get("message"));
    return Response.json({ data: { accepted: true } }, { status: 202 });
  };
  for (const denied of [new Request(url), new Request(`${url}?extra=1`, { method: "POST" }),
    new Request(`https://umbrella-falcon.saturnusgo.com${PUBLIC_SUPPORT_PATH}`, { method: "POST" })]) {
    assert.equal((await worker.fetch(denied, env)).status, 404);
  }
  assert.equal((await worker.fetch(new Request(url, { method: "POST", body, headers: { origin: "https://evil.example" } }), env)).status, 403);
  assert.equal((await worker.fetch(new Request(url, { method: "POST", body,
    headers: { origin, "content-length": String(10 * 1024 * 1024 + 1) } }), env)).status, 413);
  assert.equal(calls, 0);
  const response = await worker.fetch(new Request(url, { method: "POST", body, headers: {
    origin, "cf-connecting-ip": clientIp, authorization: "Bearer ignored", cookie: "__Host-falcon_cloud_session=ignored",
  } }), env);
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { data: { accepted: true } });
  assert.equal(response.headers.get("cache-control"), "private, no-store, no-transform");
  assert.equal(calls, 1);
});
