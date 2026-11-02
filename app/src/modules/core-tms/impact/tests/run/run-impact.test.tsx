import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { useRunImpact } from "../../application/run/useRunImpact";

const scope = { workspaceId: "w", projectId: "p" };
let state: { enabled: boolean; startBlocked: boolean; error: string | null };
function Probe() {
  const { enabled, impact, startBlocked } = useRunImpact(scope, true, false, "r");
  state = { enabled, error: impact.error, startBlocked };
  return null;
}

test("disabled automation does not request impact or block the run", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const paths: string[] = [];
  const http = { get: async (path: string) => { paths.push(path); throw new Error("403 ACCESS_DENIED"); } } as unknown as TmsHttpClient;
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(<TmsHttpClientProvider client={http}><TmsSessionProvider value={{ kind: "managed", label: "QA", subject: "qa", companyCapabilities: ["core", "integrations", "analytics"], signOut: async () => {} }}><Probe /></TmsSessionProvider></TmsHttpClientProvider>); });
    assert.deepEqual(paths, []);
    assert.equal(state.enabled, false); assert.equal(state.error, null); assert.equal(state.startBlocked, false);
  } finally { await act(async () => renderer?.unmount()); if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React"); }
});

test("enabled automation keeps pending, errors and unapproved proposals blocked", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  let resolve!: (value: unknown) => void;
  let reject!: (reason: Error) => void;
  const requests: AbortSignal[] = [];
  const http = { get: (_path: string, signal: AbortSignal) => { requests.push(signal); return new Promise((yes, no) => { resolve = yes; reject = no; }); } } as unknown as TmsHttpClient;
  const session = (capabilities?: string[]) => ({ kind: "managed" as const, label: "QA", subject: "qa", companyCapabilities: capabilities, signOut: async () => {} });
  const harness = (capabilities?: string[]) => <TmsHttpClientProvider client={http}><TmsSessionProvider value={session(capabilities)}><Probe /></TmsSessionProvider></TmsHttpClientProvider>;
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(harness(["core", "automation"])); });
    assert.equal(state.enabled, true); assert.equal(state.startBlocked, true);
    await act(async () => reject(new Error("server error")));
    assert.ok(state.error); assert.equal(state.startBlocked, true);
    await act(async () => renderer.update(harness(["core"])));
    assert.equal(state.enabled, false); assert.equal(state.startBlocked, false);
    await act(async () => renderer.update(harness(["core", "automation"])));
    await act(async () => resolve({ data: [{ workspaceId: "w", projectId: "p", runId: "r", approved: false }], nextCursor: null }));
    assert.equal(state.startBlocked, true); assert.equal(state.error, null);
    await act(async () => renderer.update(harness(["core"])));
    await act(async () => renderer.update(harness(["core", "automation"])));
    await act(async () => resolve({ data: [{ workspaceId: "w", projectId: "p", runId: "r", approved: true }], nextCursor: null }));
    assert.equal(state.startBlocked, false);
    await act(async () => renderer.update(harness(["core"])));
    await act(async () => renderer.update(harness(undefined)));
    await act(async () => resolve({ data: [], nextCursor: null }));
    assert.equal(state.enabled, true); assert.equal(state.startBlocked, false);
  } finally { await act(async () => renderer?.unmount()); if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React"); }
});

test("revoking automation aborts and ignores an in-flight response", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  let resolve!: (value: unknown) => void; let signal!: AbortSignal;
  const http = { get: (_path: string, s: AbortSignal) => { signal = s; return new Promise(yes => { resolve = yes; }); } } as unknown as TmsHttpClient;
  const harness = (capabilities: string[]) => <TmsHttpClientProvider client={http}><TmsSessionProvider value={{ kind: "managed", label: "QA", subject: "qa", companyCapabilities: capabilities, signOut: async () => {} }}><Probe /></TmsSessionProvider></TmsHttpClientProvider>;
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(harness(["core", "automation"])); });
    await act(async () => renderer.update(harness(["core"])));
    assert.equal(signal.aborted, true);
    await act(async () => resolve({ data: [{ workspaceId: "w", projectId: "p", runId: "r", approved: false }], nextCursor: null }));
    assert.equal(state.enabled, false); assert.equal(state.startBlocked, false); assert.equal(state.error, null);
  } finally { await act(async () => renderer?.unmount()); if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React"); }
});
