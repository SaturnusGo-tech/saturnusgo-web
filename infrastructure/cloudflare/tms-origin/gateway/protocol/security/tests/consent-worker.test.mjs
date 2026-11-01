import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../../../worker.mjs";

const env = { FALCON_MANAGED_AUTH_ENABLED: "true", FALCON_COMPANY_DOMAIN_SUFFIX: "example.test",
  FALCON_PLATFORM_HOSTNAME: "sandbox-falcon.example.test", FALCON_API_ORIGIN: "https://api.example.test",
  FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32) };
const host = "acme-falcon.example.test";
const strictPolicy = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; " +
  "form-action 'self' https://codex.example/callback; base-uri 'none'; frame-ancestors 'none'";

test("company gateway and worker preserve the exact restrictive OAuth consent callback policy", async t => {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => new Response("<form method=post></form>", {
    headers: { "content-type": "text/html; charset=utf-8", "content-security-policy": strictPolicy } });
  t.after(() => { globalThis.fetch = previous; });
  const result = await worker.fetch(new Request(`https://${host}/api/v1/falcon-oauth/interaction/validated-id`), env);
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("content-security-policy"), strictPolicy);
  assert.equal(result.headers.get("referrer-policy"), "same-origin");
  assert.equal(result.headers.get("x-frame-options"), "DENY");
});

test("callback policy exceptions cannot widen ordinary UI, other OAuth routes, or unsafe upstream policies", async t => {
  const previous = globalThis.fetch;
  t.after(() => { globalThis.fetch = previous; });
  const response = policy => new Response("<html></html>", {
    headers: { "content-type": "text/html", "content-security-policy": policy } });
  globalThis.fetch = async () => response(strictPolicy);
  for (const path of ["/api/v1/profile", "/api/v1/falcon-oauth/connections", "/api/v1/falcon-oauth/interaction/id/extra"]) {
    const result = await worker.fetch(new Request(`https://${host}${path}`), env);
    assert.match(result.headers.get("content-security-policy"), /form-action 'self';/);
    assert.doesNotMatch(result.headers.get("content-security-policy"), /codex\.example/);
  }
  for (const policy of [strictPolicy.replace("script-src 'none'", "script-src *"),
    strictPolicy.replace("https://codex.example/callback", "https://*.example/callback"),
    strictPolicy.replace("https://codex.example/callback", "javascript:alert(1)"),
    strictPolicy.replace("https://codex.example/callback", "http://external.example/callback")]) {
    globalThis.fetch = async () => response(policy);
    const result = await worker.fetch(new Request(`https://${host}/api/v1/falcon-oauth/interaction/validated-id`), env);
    assert.doesNotMatch(result.headers.get("content-security-policy"), /codex\.example|external\.example|javascript|script-src \*/);
  }
});
