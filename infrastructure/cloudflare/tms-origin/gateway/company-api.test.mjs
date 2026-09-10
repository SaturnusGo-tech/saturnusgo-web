import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import test from "node:test";
import { signedApiRequest } from "./signed-api-request.mjs";
import { proxyCompanyApi } from "./proxy-company-api.mjs";
import { companyHost } from "./company-host.mjs";

const env = { FALCON_MANAGED_AUTH_ENABLED: "true", FALCON_COMPANY_DOMAIN_SUFFIX: "example.test",
  FALCON_PLATFORM_HOSTNAME: "sandbox-falcon.example.test", FALCON_API_ORIGIN: "https://api.example.test",
  FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32) };
const host = "acme-falcon.example.test";
const cookie = `__Host-falcon_tenant_session=${"a".repeat(43)}`;

test("gateway signs the exact tenant, body, method, path, source address and host-only session", async () => {
  const body = JSON.stringify({ name: "Анна", phone: "" });
  const incoming = new Request(`https://${host}/api/v1/profile?test=one%20two`, { method: "PATCH", body, headers: {
    cookie: `${cookie}; __Host-falcon_platform_session=${"b".repeat(43)}; analytics=private`,
    authorization: "Bearer caller-credential", "content-type": "application/json", "if-match": '"1"',
    origin: `https://${host}`, "cf-connecting-ip": "203.0.113.4", "x-falcon-host": "another.example.test",
    "x-falcon-signature": "spoofed", "x-forwarded-host": "another.example.test", "x-actor": "admin",
  } });
  const forwarded = await signedApiRequest(incoming, env, "tenant");
  assert.equal(forwarded.url, "https://api.example.test/api/v1/profile?test=one%20two");
  assert.equal(forwarded.method, "PATCH"); assert.equal(await forwarded.text(), body);
  assert.equal(forwarded.redirect, "manual");
  assert.equal(forwarded.headers.get("cookie"), cookie);
  for (const header of ["authorization", "x-forwarded-host", "x-actor"]) assert.equal(forwarded.headers.has(header), false);
  assert.equal(forwarded.headers.get("x-falcon-host"), host);
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  const canonical = JSON.stringify(["falcon-gateway-v1", "PATCH", "/api/v1/profile?test=one%20two", host,
    forwarded.headers.get("x-falcon-time"), "203.0.113.4", `https://${host}`, digest(cookie), digest(body)]);
  assert.equal(forwarded.headers.get("x-falcon-signature"),
    createHmac("sha256", Buffer.from(env.FALCON_MANAGED_GATEWAY_KEY, "hex")).update(canonical).digest("hex"));
});

test("gateway rejects cross-origin writes, oversized bodies and unsafe upstream configuration before contacting API", async () => {
  let calls = 0;
  const send = () => { calls += 1; throw new Error("must not send"); };
  const request = (body, origin = `https://${host}`) => new Request(`https://${host}/api/v1/auth/login`,
    { method: "POST", body, headers: { origin } });
  assert.equal((await proxyCompanyApi(request("{}", "https://other-falcon.example.test"), env, "tenant", send)).status, 403);
  assert.equal((await proxyCompanyApi(request("x".repeat(2 * 1024 * 1024 + 1)), env, "tenant", send)).status, 413);
  for (const origin of ["http://localhost/", "https://api.example.test/other", `https://${host}`, "https://secret@api.example.test"]) {
    assert.equal((await proxyCompanyApi(request("{}"), { ...env, FALCON_API_ORIGIN: origin }, "tenant", send)).status, 503);
  }
  assert.equal(calls, 0);
});

test("private responses cannot set a parent-domain cookie, leak a platform cookie or cache session data", async () => {
  const request = () => new Request(`https://${host}/api/v1/auth/session`, { headers: { cookie } });
  const valid = `${cookie}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  const response = await proxyCompanyApi(request(), env, "tenant", async () => Response.json({ data: "private" },
    { headers: { "set-cookie": valid, "cache-control": "public, max-age=9999", "x-next-cursor": "next", "x-provider-token": "private" } }));
  assert.equal(response.status, 200); assert.equal(response.headers.get("set-cookie"), valid);
  assert.equal(response.headers.get("cache-control"), "private, no-store, no-transform");
  assert.equal(response.headers.has("x-provider-token"), false);
  assert.equal(response.headers.get("x-next-cursor"), "next");
  for (const invalid of [valid + "; Domain=example.test", valid.replace("tenant", "platform"),
    valid.replace("HttpOnly; ", ""), valid.replace("Path=/;", "Path=/api;"), valid.replace("SameSite=Lax", "SameSite=None")]) {
    assert.equal((await proxyCompanyApi(request(), env, "tenant", async () =>
      Response.json({}, { headers: { "set-cookie": invalid } }))).status, 502);
  }
  const redirect = await proxyCompanyApi(request(), env, "tenant", async () => Response.redirect("https://other.example.test/"));
  assert.equal(redirect.status, 502); assert.equal(redirect.headers.has("location"), false);
});

test("company host parsing leaves the legacy origin alone until migration and rejects lookalike domains", () => {
  assert.equal(companyHost(host, env), "tenant");
  assert.equal(companyHost(env.FALCON_PLATFORM_HOSTNAME, env), "platform");
  for (const value of ["tms.saturnusgo.com", "acme-falcon.example.test.evil.test", "nested.acme-falcon.example.test",
    "a-falcon.example.test", "-acme-falcon.example.test"]) assert.equal(companyHost(value, env), null);
  assert.equal(companyHost(host, {}), null);
  assert.equal(companyHost("tms.saturnusgo.com", { ...env, FALCON_LEGACY_HOST_MANAGED: "true" }), "tenant");
});
