import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { prepareCodexInstallation, CODEX_PLUGIN_VERSION } from "../prepareCodexInstallation";
import type { CodexEmployee } from "../../../domain/model/codex-employee";
const setup = (host: string): CodexEmployee["setup"] => ({ version: "1", mcpUrl: `https://${host}/api/v1/mcp`, resource: `https://${host}/api/v1/mcp`,
  oauthIssuer: `https://${host}/api/v1/falcon-oauth`, authentication: "oauth", scopes: ["falcon:read", "falcon:cases:write", "offline_access"] });
test("internal registration accepts each current tenant without changing its endpoint, issuer, resource or scopes", async () => {
  assert.equal(CODEX_PLUGIN_VERSION, "0.3.0");
  for (const host of ["company-a.test", "company-b.test"]) {
    const value = setup(host), original = structuredClone(value);
    Object.freeze(value.scopes); Object.freeze(value);
    assert.equal(await prepareCodexInstallation(value), undefined); assert.deepEqual(value, original);
  }
});
test("internal registration accepts the workspace setup scopes advertised by the Falcon API", async () => {
  const contract = JSON.parse(readFileSync(new URL("../../../../../../core/tms/generated/tms-openapi.json", import.meta.url), "utf8"));
  const scopes = contract.components.schemas.CodexSetup.properties.server.properties.scopes.items.enum;
  assert.ok(scopes.includes("falcon:dashboard-reminders:write"));
  await prepareCodexInstallation({ ...setup("company.test"), scopes });
});
test("credentials, query tokens, fragments, insecure transport and cross-company URLs are rejected", async () => {
  for (const mcpUrl of ["https://user:password@company.test/api/v1/mcp", "https://company.test/api/v1/mcp?token=secret", "https://company.test/mcp#fragment", "http://company.test/mcp", "file:///tmp/mcp"])
    await assert.rejects(prepareCodexInstallation({ ...setup("company.test"), mcpUrl }), /HTTPS connection/);
  await assert.rejects(prepareCodexInstallation({ ...setup("company.test"), oauthIssuer: "https://other.test/oauth" }), /same company/);
  await assert.rejects(prepareCodexInstallation({ ...setup("company.test"), resource: "https://other.test/mcp" }), /same company/);
});
test("registration does not accept unsupported authentication or invent permissions", async () => {
  await assert.rejects(prepareCodexInstallation({ ...setup("company.test"), scopes: ["falcon:admin" as never] }), /authorization scope/);
  await assert.rejects(prepareCodexInstallation({ ...setup("company.test"), authentication: "api_key" as never }), /configuration/);
  const value = setup("company.test"); value.scopes = ["falcon:read"];
  await prepareCodexInstallation(value); assert.deepEqual(value.scopes, ["falcon:read"]);
});
