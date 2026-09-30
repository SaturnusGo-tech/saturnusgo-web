import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { useProjectSettingsEditor } from "../useProjectSettingsEditor";

Object.assign(globalThis, { React });
const flush = () => new Promise(resolve => setImmediate(resolve));
type Input = Parameters<typeof useProjectSettingsEditor>[0];
type Request = { url: string; signal: AbortSignal; resolve(response: Response): void; reject(error: Error): void };
const response = (id = "p1", version = "v2") => new Response(JSON.stringify({ data: {
  id, workspaceId: "w", key: "PAY", name: `Fresh ${id}`, description: "Server description", status: "active",
  portfolioId: "portfolio", responsibleIdentityId: "member", testingPlan: "Keep this plan", workflowPhase: "new", checklist: [],
  rowVersion: 2, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-30T00:00:00Z",
} }), { status: 200, headers: { "content-type": "application/json", etag: `"${version}"` } });

function setup(t: TestContext, initial: Partial<Input> = {}) {
  const requests: Request[] = [];
  const client = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", credentials: "include",
    fetch: ((url, init) => new Promise<Response>((resolve, reject) => {
      requests.push({ url: String(url), signal: init!.signal as AbortSignal, resolve, reject });
    })) as typeof fetch });
  let input: Input = { projectId: "p1", enabled: true, offline: false, errorText: "Could not load project", ...initial };
  let state!: ReturnType<typeof useProjectSettingsEditor>, tree!: ReactTestRenderer, mounted = true;
  function Hook() { state = useProjectSettingsEditor(input); return null; }
  const view = () => <TmsHttpClientProvider client={client}><Hook /></TmsHttpClientProvider>;
  act(() => { tree = create(view()); });
  const run = (action: () => void) => act(async () => { action(); await flush(); });
  const unmount = () => { if (mounted) { mounted = false; act(() => tree.unmount()); } };
  t.after(unmount);
  return { requests, get: () => state, run, unmount,
    load: () => run(() => { void state.load(); }),
    resolve: (index: number, value = response()) => run(() => requests[index].resolve(value)),
    update: (next: Partial<Input>) => run(() => { input = { ...input, ...next }; tree.update(view()); }) };
}

test("opening the editor reads fresh project data and its server ETag", async t => {
  const h = setup(t);
  assert.equal(h.requests.length, 0);
  await h.load();
  assert.equal(h.get().loading, true); assert.equal(h.get().resource, null);
  assert.equal(h.requests[0].url, "https://api.example.test/api/v1/projects/p1");
  await h.resolve(0);
  assert.equal(h.get().loading, false); assert.equal(h.get().error, "");
  assert.equal(h.get().resource?.data.name, "Fresh p1");
  assert.equal(h.get().resource?.data.testingPlan, "Keep this plan");
  assert.equal(h.get().resource?.etag, '"v2"');
});

for (const [reason, input] of [["permission denied", { enabled: false }], ["offline", { offline: true }], ["no project", { projectId: "" }]] as const) {
  test(`editor cannot load when ${reason}`, async t => {
    const h = setup(t, input); await h.load();
    assert.equal(h.requests.length, 0); assert.equal(h.get().loading, false); assert.equal(h.get().resource, null);
  });
}

test("failed loading exposes API diagnostics and retry clears the error before a fresh read", async t => {
  const h = setup(t); await h.load();
  await h.resolve(0, new Response(JSON.stringify({ error: { message: "Project unavailable", code: "NOT_FOUND", requestId: "request-1" } }), {
    status: 404, headers: { "content-type": "application/json" },
  }));
  assert.match(h.get().error, /Project unavailable/); assert.match(h.get().error, /request-1/);
  assert.equal(h.get().resource, null); assert.equal(h.get().loading, false);
  await h.load(); assert.equal(h.get().error, ""); assert.equal(h.get().loading, true);
  await h.resolve(1, response("p1", "v3")); assert.equal(h.get().resource?.etag, '"v3"');
});

test("network failure uses the localized fallback", async t => {
  const h = setup(t); await h.load();
  await h.run(() => h.requests[0].reject(new Error("network internals")));
  assert.equal(h.get().error, "Could not load project"); assert.equal(h.get().loading, false);
});

test("retry cancels the previous request and ignores its late result", async t => {
  const h = setup(t); await h.load(); await h.load();
  assert.equal(h.requests[0].signal.aborted, true);
  await h.resolve(1, response("p1", "new")); await h.resolve(0, response("p1", "old"));
  assert.equal(h.get().resource?.etag, '"new"'); assert.equal(h.get().error, "");
});

test("closing aborts loading and a late response cannot reopen its resource", async t => {
  const h = setup(t); await h.load(); await h.run(() => h.get().close());
  assert.equal(h.requests[0].signal.aborted, true); assert.equal(h.get().loading, false);
  await h.resolve(0); assert.equal(h.get().resource, null); assert.equal(h.get().error, "");
  await h.load(); await h.resolve(1); assert.equal(h.get().resource?.data.id, "p1");
});

test("switching project discards the previous resource and aborts its pending read", async t => {
  const h = setup(t); await h.load(); await h.resolve(0);
  await h.update({ projectId: "p2" }); assert.equal(h.get().resource, null);
  await h.load(); await h.update({ projectId: "p3" }); assert.equal(h.requests[1].signal.aborted, true);
  await h.load(); await h.resolve(2, response("p3")); await h.resolve(1, response("p2"));
  assert.equal(h.get().resource?.data.id, "p3");
});

test("revoking access and unmounting abort in-flight reads without late errors", async t => {
  const h = setup(t); await h.load(); await h.update({ enabled: false });
  assert.equal(h.requests[0].signal.aborted, true);
  await h.run(() => h.requests[0].reject(new Error("late failure")));
  assert.equal(h.get().error, ""); assert.equal(h.get().resource, null);
  await h.update({ enabled: true }); await h.load(); h.unmount();
  assert.equal(h.requests[1].signal.aborted, true);
  await h.resolve(1);
});
