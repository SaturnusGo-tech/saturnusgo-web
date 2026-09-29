import assert from "node:assert/strict";
import test from "node:test";
import React, { createElement } from "react";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useVerificationLauncher } from "../../state/launcher/useVerificationLauncher";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { notifyDefectsChanged } from "../../../../defects/application/defect-resource-events";
import { useVerificationQueue } from "../../state/useVerificationQueue";
import { showVerificationControl } from "../../presentation/queue/visibility";
import { queue } from "../fixtures/verification-fixture";


test("hiding survives remounts, stays workspace scoped, and works with blocked storage", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  const values = new Map<string, string>();
  let blocked = false;
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
    getItem(key: string) { if (blocked) throw new Error("SecurityError"); return values.get(key) ?? null; },
    setItem(key: string, value: string) { if (blocked) throw new Error("SecurityError"); values.set(key, value); },
  } } });
  let current!: ReturnType<typeof useVerificationLauncher>;
  function Probe({ workspaceId }: { workspaceId: string }) { current = useVerificationLauncher(workspaceId); return null; }
  // The renderer bundles React 18 types; the app has React 19 type declarations.
  const probe = (workspaceId: string) => createElement(Probe, { workspaceId }) as unknown as Parameters<typeof create>[0];
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(probe("umbrella")); });
    assert.equal(current.ready, true); assert.equal(current.collapsed, false);
    await act(async () => current.setCollapsed(true));
    await act(async () => renderer.unmount());
    await act(async () => { renderer = create(probe("umbrella")); });
    assert.equal(current.collapsed, true);
    await act(async () => renderer.update(probe("darwin")));
    assert.equal(current.collapsed, false);
    await act(async () => renderer.update(probe("umbrella")));
    assert.equal(current.collapsed, true);
    await act(async () => current.setCollapsed(false));
    await act(async () => renderer.unmount());
    blocked = true;
    await act(async () => { renderer = create(probe("umbrella")); });
    assert.equal(current.ready, true); assert.equal(current.collapsed, false);
    await act(async () => current.setCollapsed(true)); assert.equal(current.collapsed, true);
    await act(async () => current.setCollapsed(false)); assert.equal(current.collapsed, false);
  } finally {
    await act(async () => renderer?.unmount());
    if (original) Object.defineProperty(globalThis, "window", original); else Reflect.deleteProperty(globalThis, "window");
  }
});

async function fixture() {
  const descriptors = ["window", "document", "React"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  Object.assign(globalThis, { React });
  const window = Object.assign(new EventTarget(), { setInterval: () => 1, clearInterval: () => {} });
  const document = Object.assign(new EventTarget(), { visibilityState: "visible" });
  Object.defineProperty(globalThis, "window", { configurable: true, value: window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: document });
  const requests: { url: string; signal: AbortSignal | null | undefined; reply: (response: Response) => void }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "qa",
    fetch: (url, init) => new Promise(resolve => requests.push({ url: String(url), signal: init?.signal, reply: resolve })) });
  let current!: ReturnType<typeof useVerificationQueue>;
  function Probe({ projectId }: { projectId: string }) { current = useVerificationQueue(projectId, true, false); return null; }
  const tree = (projectId: string) => createElement(TmsHttpClientProvider, { client: http, children: createElement(Probe, { projectId }) }) as unknown as Parameters<typeof create>[0];
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(tree("project-1")); });
  return { window, document, requests, state: () => current,
    visible: () => showVerificationControl({ ...current, enabled: true, canStart: true, pendingStart: false, unresolved: false, disabledReason: "" }),
    async resolve(index: number, totalCases: number, status = 200) {
      await act(async () => requests[index].reply(new Response(JSON.stringify(status === 200
        ? { ...queue, data: { ...queue.data, totalCases } } : { error: { code: "INTERNAL_ERROR", message: "Failed" } }), { status })));
    },
    async project(projectId: string) { await act(async () => renderer.update(tree(projectId))); },
    async dispose() {
      await act(async () => renderer.unmount());
      for (const [key, descriptor] of descriptors) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test("refreshes never advertise stale fixes, and failed refreshes discard their counts", async () => {
  const f = await fixture();
  try {
    assert.equal(f.visible(), false);
    await f.resolve(0, 3); assert.equal(f.visible(), true);
    await act(async () => { f.window.dispatchEvent(new Event("focus")); });
    assert.equal(f.visible(), false);
    await f.resolve(1, 0, 500);
    assert.equal(f.state().data, null);
    assert.equal(f.visible(), false);
    await act(async () => { f.window.dispatchEvent(new Event("focus")); });
    await f.resolve(2, 0); assert.equal(f.visible(), false);
    await act(async () => { f.window.dispatchEvent(new Event("focus")); });
    await f.resolve(3, 2); assert.equal(f.visible(), true);
  } finally { await f.dispose(); }
});

test("returning to a visible tab and local defect changes revalidate availability", async () => {
  const f = await fixture();
  try {
    await f.resolve(0, 2);
    await act(async () => notifyDefectsChanged("different-project"));
    assert.equal(f.requests.length, 1);
    await act(async () => notifyDefectsChanged("project-1"));
    assert.equal(f.requests.length, 2);
    assert.equal(f.visible(), false);
    await f.resolve(1, 0); assert.equal(f.visible(), false);
    await act(async () => { f.document.dispatchEvent(new Event("visibilitychange")); });
    assert.equal(f.requests.length, 3);
    await f.resolve(2, 1); assert.equal(f.visible(), true);
  } finally { await f.dispose(); }
});

test("late queue responses from a previous project cannot reveal its launcher", async () => {
  const f = await fixture();
  try {
    await f.project("project-2");
    assert.equal(f.requests[0].signal?.aborted, true);
    assert.equal(f.visible(), false);
    await f.resolve(1, 0);
    await f.resolve(0, 9);
    assert.equal(f.state().data?.totalCases, 0);
    assert.equal(f.visible(), false);
  } finally { await f.dispose(); }
});
