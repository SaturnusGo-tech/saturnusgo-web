import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { useWorkspaceCodex } from "../../composition/workspace/useWorkspaceCodex";
import { status } from "../support/employee-fixture";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
let state: ReturnType<typeof useWorkspaceCodex>;
function Probe({ workspaceId = "personal" }: { workspaceId?: string }) { state = useWorkspaceCodex(true, workspaceId); return null; }
for (const kind of ["personal", "company", "archived_company"] as const) test(`${kind} Codex uses the permitted server metadata without deriving access from session kind`, async () => {
  const paths: string[] = [];
  const http = createTmsHttpClient({ apiBase: "https://tms.test/api/v1", credentials: "include", fetch: async input => {
    const path = new URL(String(input)).pathname; paths.push(path);
    if (path === "/api/v1/company/agents/codex") return Response.json({ data: status });
    return Response.json({ data: { workspaceId: "personal", companyName: "Workspace", teamAdministrationAvailable: kind === "company", canConnect: true,
      readOnly: kind === "archived_company", connectionKind: kind, status: kind === "archived_company" ? "read_only" : "available", installation: { pluginUrl: null },
      server: { name: "Falcon", version: "1", authentication: "oauth", url: "https://tms.test/api/v1/mcp", resource: "https://tms.test/api/v1/mcp", issuer: "https://tms.test/api/v1/falcon-oauth", connectionName: "falcon-personal", scopes: ["falcon:read", "offline_access"] } } });
  } });
  let view!: ReactTestRenderer; await act(async () => { view = create(<TmsHttpClientProvider client={http}><Probe /></TmsHttpClientProvider>); });
  assert.equal(state.available, true); assert.equal(state.connection?.mcpUrl, "https://tms.test/api/v1/mcp"); assert.deepEqual(state.connection?.scopes, ["falcon:read", "offline_access"]);
  assert.equal(paths.includes("/api/v1/company/agents/codex"), kind === "company");
  if (kind !== "company") assert.equal(state.employee, null);
  assert.equal(paths.some(path => /activate|deactivate|mcp-connections/.test(path)), false);
  await act(async () => view.unmount());
});
