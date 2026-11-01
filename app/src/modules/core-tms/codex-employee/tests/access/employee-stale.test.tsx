import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createCodexEmployeeApi } from "../../data/http/codex-employee-api";
import { useCodexEmployee } from "../../application/state/useCodexEmployee";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { status } from "../support/employee-fixture";
let current: ReturnType<typeof useCodexEmployee>;
function Probe({ api }: {
    api: ReturnType<typeof createCodexEmployeeApi>;
}) { current = useCodexEmployee(api); return null; }
test("company changes cancel pending status/connections and cannot render another company's late employee", async () => {
    const pending: {
        signal: AbortSignal;
        resolve: (value: unknown) => void;
    }[] = [];
    const make = () => createCodexEmployeeApi({ getResource: (_p: string, s: AbortSignal) => new Promise(resolve => pending.push({ signal: s, resolve })), get: (_p: string, s: AbortSignal) => new Promise(resolve => pending.push({ signal: s, resolve })) } as unknown as TmsHttpClient);
    let view!: ReactTestRenderer;
    const first = make(), second = make();
    await act(async () => { view = create(<Probe api={first}/>); });
    await act(async () => view.update(<Probe api={second}/>));
    assert.ok(pending.slice(0, 2).every(p => p.signal.aborted));
    assert.equal(current.employee, null);
    await act(async () => { pending[0].resolve({ data: status, etag: '"3"' }); pending[1].resolve({ data: [] }); });
    assert.equal(current.employee, null);
    await act(async () => { pending[2].resolve({ data: { ...status, identityId: "new-agent" }, etag: '"3"' }); pending[3].resolve({ data: [] }); });
    assert.equal(current.employee?.identityId, "new-agent");
    await act(async () => view.unmount());
});
