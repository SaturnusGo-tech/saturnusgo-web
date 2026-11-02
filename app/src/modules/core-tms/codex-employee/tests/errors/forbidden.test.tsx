import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createCodexEmployeeApi } from "../../data/http/codex-employee-api";
import { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { status } from "../support/employee-fixture";
let state: ReturnType<typeof useCodexEmployee>;
const snapshot = () => state;
function Probe({ api }: { api: ReturnType<typeof createCodexEmployeeApi> }) { state = useCodexEmployee(api); return null; }
test("403 retains unknown cause and retry loads the server status", async () => {
  let denied = true; let calls = 0;
  const http = createTmsHttpClient({ apiBase: "https://company.test/api/v1", credentials: "include", fetch: async input => {
    if (new URL(String(input)).pathname.endsWith("mcp-connections")) return Response.json({ data: [] });
    calls++;
    return denied ? Response.json({ error: { code: "FORBIDDEN", message: "Denied", requestId: "r" } }, { status: 403 }) : Response.json({ data: status });
  } });
  const api = createCodexEmployeeApi(http); let view!: ReactTestRenderer;
  await act(async () => { view = create(<Probe api={api} />); });
  assert.equal(state.error, "FORBIDDEN"); assert.equal(state.employee, null);
  denied = false; await act(async () => state.refresh());
  assert.equal(calls, 2); assert.equal(state.error, null); assert.equal(snapshot().employee?.status, "active");
  await act(async () => view.unmount());
});
