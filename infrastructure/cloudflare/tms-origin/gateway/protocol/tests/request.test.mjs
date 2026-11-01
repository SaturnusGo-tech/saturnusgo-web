import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import test from "node:test";
import { signedApiRequest } from "../../signed-api-request.mjs";
import { proxyCompanyApi } from "../../proxy-company-api.mjs";

const env = { FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32), FALCON_API_ORIGIN: "https://api.example.test" };
const host = "acme-falcon.example.test";
const issuer = "/api/v1/falcon-oauth";
const digest = value => createHash("sha256").update(value).digest("hex");

test("server MCP POST reaches its own company with Bearer and protocol headers bound by v2", async () => {
  const body = '{"jsonrpc":"2.0","method":"initialize","id":1}';
  const authorization = "Bearer scoped-mcp-fixture";
  const cookie = `__Host-falcon_tenant_session=${"a".repeat(43)}`;
  const request = new Request(`https://${host}/api/v1/mcp`, { method: "POST", body,
    headers: { authorization, cookie: `${cookie}; tracking=private`, "content-type": "application/json",
      "mcp-protocol-version": "2025-11-25", "mcp-session-id": "fixture-session", "last-event-id": "event-4",
      "cf-connecting-ip": "203.0.113.4", "x-falcon-signature": "spoofed" } });
  const forwarded = await signedApiRequest(request, env, "tenant");
  assert.equal(forwarded.headers.get("authorization"), authorization);
  assert.equal(forwarded.headers.get("mcp-protocol-version"), "2025-11-25");
  assert.equal(forwarded.headers.get("mcp-session-id"), "fixture-session");
  assert.equal(forwarded.headers.get("last-event-id"), "event-4");
  assert.equal(forwarded.headers.get("cookie"), cookie);
  assert.equal(await forwarded.text(), body);
  const canonical = JSON.stringify(["falcon-gateway-v2", "POST", "/api/v1/mcp", host,
    forwarded.headers.get("x-falcon-time"), "203.0.113.4", "", digest(cookie), digest(body), digest(authorization)]);
  assert.equal(forwarded.headers.get("x-falcon-signature"),
    `v2:${createHmac("sha256", Buffer.from(env.FALCON_MANAGED_GATEWAY_KEY, "hex")).update(canonical).digest("hex")}`);
});

test("MCP resource metadata uses v2 even without a credential", async () => {
  const forwarded = await signedApiRequest(new Request(`https://${host}/api/v1/mcp/resource-metadata`), env, "tenant");
  const canonical = JSON.stringify(["falcon-gateway-v2", "GET", "/api/v1/mcp/resource-metadata", host,
    forwarded.headers.get("x-falcon-time"), "", "", digest(""), digest(""), digest("")]);
  assert.equal(forwarded.headers.get("x-falcon-signature"),
    `v2:${createHmac("sha256", Buffer.from(env.FALCON_MANAGED_GATEWAY_KEY, "hex")).update(canonical).digest("hex")}`);
});

test("only exact public OAuth POST endpoints allow absent Origin and keep OAuth signing v1", async () => {
  for (const suffix of ["/token", "/reg", "/token/revocation"]) {
    const path = issuer + suffix;
    const forwarded = await signedApiRequest(new Request(`https://${host}${path}`, { method: "POST", body: "grant_type=fixture",
      headers: { "content-type": "application/x-www-form-urlencoded" } }), env, "tenant");
    assert.equal(forwarded.url, `https://api.example.test${path}`);
    assert.match(forwarded.headers.get("x-falcon-signature"), /^[a-f0-9]{64}$/);
  }
});

test("cross-origin writes and protocol lookalikes stay blocked before contacting the API", async () => {
  const paths = ["/api/v1/profile", "/api/v1/mcp/", "/api/v1/mcp-other", issuer + "/interaction/valid-id",
    issuer + "/token/", issuer + "/token/other", issuer + "/reg/other"];
  let calls = 0;
  const send = async () => { calls++; return Response.json({}); };
  for (const path of paths) {
    const result = await proxyCompanyApi(new Request(`https://${host}${path}`, { method: "POST", body: "{}" }), env, "tenant", send);
    assert.equal(result.status, 403, path);
  }
  for (const path of ["/api/v1/mcp", issuer + "/token"]) {
    const result = await proxyCompanyApi(new Request(`https://${host}${path}`, { method: "POST", body: "{}",
      headers: { origin: "https://other-falcon.example.test" } }), env, "tenant", send);
    assert.equal(result.status, 403, path);
  }
  assert.equal(calls, 0);
});

test("platform requests cannot use tenant MCP exceptions or forward OAuth cookies", async () => {
  const response = await proxyCompanyApi(new Request(`https://${host}/api/v1/mcp`, { method: "POST", body: "{}" }),
    env, "platform", async () => Response.json({}));
  assert.equal(response.status, 403);
  const forwarded = await signedApiRequest(new Request(`https://${host}/api/v1/auth/session`, {
    headers: { cookie: "falcon_mcp_session=oauth-private; falcon_mcp_session.sig=sig; tracking=private" },
  }), env, "tenant");
  assert.equal(forwarded.headers.has("cookie"), false);
});

test("OAuth issuer forwards only its named cookies together with its own tenant session", async () => {
  const cookies = ["falcon_mcp_session=session", "falcon_mcp_session.sig=signature", "falcon_mcp_interaction=interaction",
    "falcon_mcp_interaction.sig=signature", "falcon_mcp_resume=resume", "falcon_mcp_resume.sig=signature"];
  const tenant = `__Host-falcon_tenant_session=${"a".repeat(43)}`;
  const forwarded = await signedApiRequest(new Request(`https://${host}${issuer}/interaction/test`, { headers: {
    cookie: `${tenant}; ${cookies.join("; ")}; falcon_mcp_unknown=unknown; __Host-falcon_platform_session=platform; tracking=private`,
    authorization: "Bearer do-not-forward",
  } }), env, "tenant");
  assert.equal(forwarded.headers.get("cookie"), `${tenant}; ${cookies.join("; ")}`);
  assert.equal(forwarded.headers.has("authorization"), false);
});
