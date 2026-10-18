import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import { useImpactAnalysis } from "../../application/detail/useImpactAnalysis";
import type { ImpactAnalysis } from "../../model/impact-types";
import { analysis, scope } from "../fixtures/impact-fixture";
const originalReact = Object.getOwnPropertyDescriptor(globalThis, "React");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
const documentTarget = Object.assign(new EventTarget(), { visibilityState: "visible" });
before(() => Object.assign(globalThis, { React, document: documentTarget }));
after(() => {
  if (originalReact) Object.defineProperty(globalThis, "React", originalReact); else Reflect.deleteProperty(globalThis, "React");
  if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument); else Reflect.deleteProperty(globalThis, "document");
});
const permissions = { read: true, configure: true, review: true, manageCases: true, audit: true };
async function harness(subject: string) {
  const calls: { method: string; body: unknown; signal: AbortSignal; headers: Headers; resolve(value: ImpactAnalysis, etag?: string): void; reject(status: number): void }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: (_, init) =>
    new Promise(resolve => calls.push({ method: init!.method!, body: init?.body ? JSON.parse(String(init.body)) : null,
      signal: init!.signal as AbortSignal, headers: new Headers(init!.headers),
      resolve: (value, etag = `v${value.rowVersion}`) => resolve(new Response(JSON.stringify({ data: value }), { headers: { etag } })),
      reject: status => resolve(new Response(JSON.stringify({ error: { code: "PRECONDITION_FAILED", message: "changed" } }), { status })) })) });
  let state!: ReturnType<typeof useImpactAnalysis>; let root!: ReactTestRenderer;
  function Probe({ id = "analysis_qa", read = true }: { id?: string; read?: boolean }) {
    state = useImpactAnalysis(scope, id, { ...permissions, read }, false); return null;
  }
  const tree = (id?: string, read = true): React.JSX.Element => React.createElement(TmsHttpClientProvider, { client: http, children:
    React.createElement(TmsSessionProvider, { value: { kind: "managed", label: "QA", subject, signOut: async () => {} },
      children: React.createElement(Probe, { id, read }) }) });
  await act(async () => { root = create(tree()); });
  return { calls, get: () => state, update: (id: string, read = true) => act(async () => root.update(tree(id, read))), dispose: () => act(async () => root.unmount()) };
}
test("a stale scope refreshes its ETag and waits for a new explicit decision", async () => {
  const h = await harness("stale-scope-hook");
  try {
    await act(async () => h.calls[0].resolve(analysis()));
    await act(async () => { void h.get().command({ action: "scope", body: { caseIds: ["case_user"] } }); });
    await act(async () => h.calls[1].reject(412));
    assert.equal(h.calls.length, 3); assert.equal(h.calls[2].method, "GET");
    await act(async () => h.calls[2].resolve(analysis({ rowVersion: 9 })));
    assert.equal(h.get().etag, "v9"); assert.equal(h.get().pending, false); assert.equal(h.get().unresolved, null);
    assert.match(h.get().error!, /latest analysis.*review/i); assert.equal(h.calls.length, 3);
    await act(async () => { void h.get().command({ action: "scope", body: { caseIds: ["case_reviewed"] } }); });
    assert.equal(h.calls[3].headers.get("if-match"), "v9");
    assert.notEqual(h.calls[3].headers.get("idempotency-key"), h.calls[1].headers.get("idempotency-key"));
    assert.deepEqual(h.calls[3].body, { caseIds: ["case_reviewed"] });
    await act(async () => h.calls[3].resolve(analysis({ rowVersion: 10 })));
    await act(async () => h.calls[4].resolve(analysis({ rowVersion: 10 })));
  } finally { await h.dispose(); }
});
test("commands cancel polling reads, settle loading, and block concurrent refreshes", async () => {
  const h = await harness("polling-write-hook");
  try {
    await act(async () => h.calls[0].resolve(analysis({ status: "processing" })));
    await act(async () => { documentTarget.dispatchEvent(new Event("visibilitychange")); }); assert.equal(h.get().loading, true);
    await act(async () => { void h.get().command({ action: "approve", body: {} }); void h.get().refresh(); });
    assert.equal(h.calls[1].signal.aborted, true); assert.equal(h.calls.length, 3); assert.equal(h.get().loading, false);
    await act(async () => h.calls[1].resolve(analysis({ rowVersion: 6 })));
    assert.equal(h.get().data?.rowVersion, 7);
    await act(async () => h.calls[2].resolve(analysis({ rowVersion: 8 })));
    await act(async () => h.calls[3].resolve(analysis({ rowVersion: 8 })));
    assert.equal(h.get().data?.rowVersion, 8); assert.equal(h.get().pending, false); assert.equal(h.get().loading, false);
  } finally { await h.dispose(); }
});
test("losing read access cancels loading and rejects a late resource", async () => {
  const h = await harness("read-access-hook");
  try {
    assert.equal(h.get().loading, true);
    await h.update("analysis_qa", false);
    assert.equal(h.calls[0].signal.aborted, true); assert.equal(h.get().loading, false); assert.equal(h.calls.length, 1);
    await act(async () => h.calls[0].resolve(analysis()));
    assert.equal(h.get().data, null); assert.equal(h.get().loading, false);
  } finally { await h.dispose(); }
});
test("a cancelled write cannot hold or clear the next owner's command", async () => {
  const h = await harness("owner-write-hook");
  try {
    await act(async () => h.calls[0].resolve(analysis()));
    await act(async () => { void h.get().command({ action: "approve", body: {} }); });
    await h.update("analysis_next"); assert.equal(h.calls[1].signal.aborted, true);
    await act(async () => h.calls[2].resolve(analysis({ id: "analysis_next", rowVersion: 9 })));
    await act(async () => { void h.get().command({ action: "approve", body: {} }); });
    assert.equal(h.calls.length, 4); assert.equal(h.get().pending, true);
    await act(async () => h.calls[1].resolve(analysis({ rowVersion: 8 })));
    assert.equal(h.get().data?.id, "analysis_next"); assert.equal(h.get().pending, true);
    await act(async () => h.calls[3].resolve(analysis({ id: "analysis_next", rowVersion: 10 })));
    await act(async () => h.calls[4].resolve(analysis({ id: "analysis_next", rowVersion: 10 })));
    assert.equal(h.get().pending, false); assert.equal(h.get().data?.rowVersion, 10);
  } finally { await h.dispose(); }
});
