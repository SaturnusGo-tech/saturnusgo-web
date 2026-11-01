import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../../../worker.mjs";

const env = { FALCON_MANAGED_AUTH_ENABLED: "true", FALCON_COMPANY_DOMAIN_SUFFIX: "example.test",
  FALCON_PLATFORM_HOSTNAME: "sandbox-falcon.example.test", FALCON_API_ORIGIN: "https://api.example.test",
  FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32) };
const host = "acme-falcon.example.test";

test("only exact tenant discovery aliases reach their corresponding backend metadata", async t => {
  const previous = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async request => { seen.push(request); return Response.json({ issuer: `https://${host}/api/v1/falcon-oauth` }); };
  t.after(() => { globalThis.fetch = previous; });
  for (const [path, target, signature] of [
    ["/.well-known/oauth-authorization-server/api/v1/falcon-oauth", "/api/v1/falcon-oauth/.well-known/openid-configuration", /^[a-f0-9]{64}$/],
    ["/.well-known/oauth-protected-resource/api/v1/mcp", "/api/v1/mcp/resource-metadata", /^v2:[a-f0-9]{64}$/],
  ]) {
    const response = await worker.fetch(new Request(`https://${host}${path}`), env);
    assert.equal(response.status, 200, path);
    const forwarded = seen.at(-1);
    assert.equal(forwarded.url, `https://api.example.test${target}`);
    assert.equal(forwarded.headers.get("x-falcon-host"), host);
    assert.match(forwarded.headers.get("x-falcon-signature"), signature);
  }
  const before = seen.length;
  for (const path of ["/.well-known/oauth-authorization-server", "/.well-known/oauth-authorization-server/api/v1/other",
    "/.well-known/oauth-protected-resource/api/v1/mcp-other", "/.well-known/oauth-protected-resource/api/v1/mcp/"]) {
    const response = await worker.fetch(new Request(`https://${host}${path}`), env);
    assert.equal(response.status, 404, path);
  }
  assert.equal((await worker.fetch(new Request(`https://${env.FALCON_PLATFORM_HOSTNAME}/.well-known/oauth-protected-resource/api/v1/mcp`), env)).status, 404);
  assert.equal((await worker.fetch(new Request(`https://${host}/.well-known/oauth-protected-resource/api/v1/mcp`, { method: "POST" }), env)).status, 404);
  assert.equal(seen.length, before);
});
