import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createCodexEmployeeApi } from "../../data/http/codex-employee-api";
import { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { status, connection } from "../support/employee-fixture";
let current: ReturnType<typeof useCodexEmployee>;
function Probe({ api }: {
    api: ReturnType<typeof createCodexEmployeeApi>;
}) { current = useCodexEmployee(api); return null; }
test("tester can connect with server rights, revoke own grant after disable and cannot disable company", async () => {
    const calls: {
        path: string;
        method: string;
        headers: Headers;
    }[] = [];
    let active = true;
    const http = createTmsHttpClient({ apiBase: "https://company.test/api/v1", credentials: "include", fetch: async (input, init) => {
            const path = new URL(String(input)).pathname;
            calls.push({ path, method: init?.method ?? "GET", headers: new Headers(init?.headers) });
            if (path.endsWith("/revoke"))
                return new Response(null, { status: 204 });
            if (path.endsWith("mcp-connections"))
                return Response.json({ data: [connection] });
            return Response.json({ data: { ...status, status: active ? "active" : "inactive", canConnect: active, canDeactivate: false } }, { headers: { etag: '"3"' } });
        } });
    let view!: ReactTestRenderer;
    const api = createCodexEmployeeApi(http);
    await act(async () => { view = create(<Probe api={api}/>); });
    assert.equal(current.employee?.canConnect, true);
    assert.equal(current.employee.canDeactivate, false);
    await act(async () => { await current.deactivate(); });
    assert.equal(calls.some(c => c.path.endsWith("deactivate")), false);
    active = false;
    await act(async () => current.refresh());
    assert.equal(current.employee?.canConnect, false);
    assert.equal(current.connections.length, 1);
    await act(async () => { await current.revoke(connection.id); });
    assert.ok(calls.some(c => c.path.endsWith(`/${connection.id}/revoke`) && c.method === "POST"));
    assert.equal(calls.some(c => c.path.includes("/admin")), false);
    await act(async () => view.unmount());
});
test("manager disable preserves strong status ETag and explicit idempotency", async () => {
    let options: RequestInit | undefined;
    const http = createTmsHttpClient({ apiBase: "https://company.test/api/v1", credentials: "include", fetch: async (_, init) => {
            if (init?.method === "POST") {
                options = init;
                return Response.json({ data: { provider: "codex", status: "inactive", identityId: "agent", rowVersion: 4, securityVersion: 8 } });
            }
            return Response.json({ data: status }, { headers: { etag: '"3"' } });
        } });
    const api = createCodexEmployeeApi(http);
    const employee = await api.status(new AbortController().signal);
    await api.deactivate(employee, "command-disable-123", new AbortController().signal);
    assert.equal(new Headers(options?.headers).get("if-match"), '"3"');
    assert.equal(new Headers(options?.headers).get("idempotency-key"), "command-disable-123");
});
