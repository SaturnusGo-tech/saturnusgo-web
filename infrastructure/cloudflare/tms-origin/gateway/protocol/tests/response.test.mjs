import assert from "node:assert/strict";
import test from "node:test";
import { proxyCompanyApi } from "../../proxy-company-api.mjs";

const env = { FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32), FALCON_API_ORIGIN: "https://api.example.test" };
const host = "acme-falcon.example.test";
const issuer = "/api/v1/falcon-oauth";

test("MCP challenge and protocol response headers survive without leaking unrelated credentials", async () => {
  const result = await proxyCompanyApi(new Request(`https://${host}/api/v1/mcp`), env, "tenant", async () =>
    new Response("unauthorized", { status: 401, headers: {
      "www-authenticate": `Bearer resource_metadata="https://${host}/api/v1/mcp/resource-metadata"`,
      "mcp-session-id": "server-session", "mcp-protocol-version": "2025-11-25", "x-provider-token": "private",
    } }));
  assert.equal(result.status, 401);
  assert.equal(result.headers.get("www-authenticate"), `Bearer resource_metadata="https://${host}/api/v1/mcp/resource-metadata"`);
  assert.equal(result.headers.get("mcp-session-id"), "server-session");
  assert.equal(result.headers.get("mcp-protocol-version"), "2025-11-25");
  assert.equal(result.headers.has("x-provider-token"), false);
  const ordinary = await proxyCompanyApi(new Request(`https://${host}/api/v1/profile`), env, "tenant", async () =>
    new Response("unauthorized", { status: 401, headers: { "www-authenticate": "private", "mcp-session-id": "private" } }));
  assert.equal(ordinary.headers.has("www-authenticate"), false);
  assert.equal(ordinary.headers.has("mcp-session-id"), false);
});

test("OAuth authorization redirects survive only on issuer routes and safe URL schemes", async () => {
  const request = new Request(`https://${host}${issuer}/auth`);
  for (const location of ["https://chatgpt.com/connector_platform/oauth/callback?code=fixture",
    "http://127.0.0.1:1455/callback?code=fixture", "http://localhost:1455/callback?code=fixture",
    `${issuer}/interaction/opaque-id`]) {
    const response = await proxyCompanyApi(request, env, "tenant", async () => new Response(null, { status: 303, headers: { location } }));
    assert.equal(response.status, 303, location);
    assert.equal(response.headers.get("location"), location);
  }
  for (const location of ["javascript:alert(1)", "data:text/html,private", "https://name:password@example.test/",
    "http://external.example.test/callback"]) {
    const response = await proxyCompanyApi(request, env, "tenant", async () => new Response(null, { status: 302, headers: { location } }));
    assert.equal(response.status, 502, location);
  }
  const ordinary = await proxyCompanyApi(new Request(`https://${host}/api/v1/profile`), env, "tenant", async () =>
    new Response(null, { status: 302, headers: { location: "https://chatgpt.com/" } }));
  assert.equal(ordinary.status, 502);
  assert.equal(ordinary.headers.has("location"), false);
});

test("OAuth cookies are host-only, secure, HttpOnly, Lax and constrained to issuer paths", async () => {
  const request = new Request(`https://${host}${issuer}/auth`);
  const valid = "falcon_mcp_interaction=fixture; Path=/api/v1/falcon-oauth/interaction; HttpOnly; Secure; SameSite=Lax";
  const result = await proxyCompanyApi(request, env, "tenant", async () => new Response("{}", { headers: { "set-cookie": valid } }));
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("set-cookie"), valid);
  for (const cookie of [valid + "; Domain=saturnusgo.com", valid.replace("HttpOnly; ", ""),
    valid.replace("Secure; ", ""), valid.replace("SameSite=Lax", "SameSite=None"),
    valid.replace("/api/v1/falcon-oauth/interaction", "/"), valid.replace("falcon_mcp_interaction=", "unknown="),
    valid.replace("/api/v1/falcon-oauth/interaction", "/api/v1/falcon-oauth-other")]) {
    const response = await proxyCompanyApi(request, env, "tenant", async () => new Response("{}", { headers: { "set-cookie": cookie } }));
    assert.equal(response.status, 502, cookie);
  }
  const outside = await proxyCompanyApi(new Request(`https://${host}/api/v1/profile`), env, "tenant", async () =>
    new Response("{}", { headers: { "set-cookie": valid } }));
  assert.equal(outside.status, 502);
});
