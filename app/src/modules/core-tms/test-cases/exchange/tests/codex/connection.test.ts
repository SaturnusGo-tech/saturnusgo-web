import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { PersonalCodexConnection } from "../../../../codex-employee/domain/model/codex-employee";
import { importCodexConnection, importCodexSetupLink, loadImportCodexConnection } from "../../state/codex/import-codex-connection";
import { grant, setup, scopes } from "./fixtures/connection-fixture";

const now = Date.parse("2026-11-12T00:00:00Z");

test("import readiness requires the selected project and one current complete grant", () => {
  const state = (connections: readonly PersonalCodexConnection[], canManage = true) => importCodexConnection({ setup, connections }, "p", canManage, now);
  assert.equal(state([grant]).status, "ready");
  assert.equal(state([grant]).canUpload, false);
  assert.equal(state([{ ...grant, scopes: [...scopes, "falcon:attachments:write"] }]).canUpload, true);
  for (const changed of [{ ...grant, projectIds: ["other"] }, { ...grant, revokedAt: "2026-11-11T00:00:00Z" },
    { ...grant, expiresAt: "2026-11-11T00:00:00Z" }, { ...grant, expiresAt: "invalid" }]) {
    assert.equal(state([changed]).status, "available");
  }
  assert.equal(state([{ ...grant, scopes: ["falcon:read", "falcon:cases:create"] },
    { ...grant, id: "another", scopes: ["falcon:read", "falcon:repository:write"] }]).status, "limited");
  assert.equal(state([{ ...grant, scopes: ["falcon:cases:create", "falcon:repository:write"] }]).canExport, false);
  assert.notEqual(state([grant], false).status, "ready");
});

test("server restrictions and unavailable installation metadata never claim host installation", () => {
  assert.equal(importCodexConnection({ setup: { ...setup, readOnly: true }, connections: [grant] }, "p", true, now).status, "limited");
  assert.equal(importCodexConnection({ setup: { ...setup, status: "unavailable" }, connections: [grant] }, "p", true, now).status, "unavailable");
  assert.equal(importCodexConnection({ setup, connections: [] }, "p", true, now).status, "available");
  assert.equal(importCodexConnection({ setup, connections: [] }, "p", true, now).pluginUrl, setup.installation.pluginUrl);
  for (const pluginUrl of [null, "javascript:alert(1)", "https://foreign.example/plugin", "https://chatgpt.com/plugins/x?token=secret"]) {
    assert.equal(importCodexConnection({ setup: { ...setup, installation: { pluginUrl } }, connections: [] }, "p", true, now).pluginUrl, null);
  }
});

test("setup navigation opens existing MCP instructions for the exact selected scope", () => {
  const target = new URL(importCodexSetupLink("https://tenant.example/work/?workspaceId=old&projectId=old&view=imports&importFile=private#folder", "w", "p"), "https://tenant.example");
  assert.equal(target.search, "?workspaceId=w&projectId=p&view=config&settings=plugins&plugin=codex&pluginSetup=connect");
  assert.equal(target.hash, "");
});

test("connection discovery uses only scoped read APIs and follows every grant page", async () => {
  const calls: { url: URL; method: string }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://tenant.example/api/v1", credentials: "include", fetch: async (input, options) => {
    const url = new URL(String(input)); calls.push({ url, method: options?.method ?? "GET" });
    if (url.pathname.endsWith("/codex/setup")) return Response.json({ data: setup });
    return url.searchParams.has("cursor") ? Response.json({ data: [grant], meta: { nextCursor: null } })
      : Response.json({ data: [], meta: { nextCursor: "next+grant" } });
  } });
  const result = await loadImportCodexConnection(http, "w", new AbortController().signal);
  assert.equal(importCodexConnection(result, "p", true, now).status, "ready");
  assert.ok(calls.every(call => call.method === "GET" && call.url.searchParams.get("workspaceId") === "w"));
  assert.deepEqual(calls.filter(call => call.url.pathname.endsWith("/mcp-connections")).map(call => call.url.searchParams.get("cursor")), [null, "next+grant"]);
});

test("scope mismatches and permission failures stay failures, rather than looking disconnected", async () => {
  for (const response of [Response.json({ data: { ...setup, workspaceId: "foreign" } }),
    Response.json({ error: { code: "FORBIDDEN", message: "Private company detail" } }, { status: 403 })]) {
    const http = createTmsHttpClient({ apiBase: "https://tenant.example/api/v1", credentials: "include", fetch: async input =>
      String(input).includes("/codex/setup") ? response.clone() : Response.json({ data: [] }) });
    await assert.rejects(loadImportCodexConnection(http, "w", new AbortController().signal));
  }
});
