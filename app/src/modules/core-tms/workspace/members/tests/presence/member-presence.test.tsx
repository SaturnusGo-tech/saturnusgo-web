import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { useMemberPresence } from "../../state/presence/useMemberPresence";

test("presence sends the local time zone only from the visible, connected workspace", async t => {
  const doc = Object.assign(new EventTarget(), { visibilityState: "hidden" });
  const win = new EventTarget();
  let interval: (() => void) | undefined;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { configurable: true, value: doc });
  Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(win, {
    setInterval: (callback: () => void, delay: number) => { assert.equal(delay, 45000); interval = callback; return 1; },
    clearInterval: () => { interval = undefined; },
  }) });
  const now = t.mock.method(Date, "now", () => 100000);
  t.after(() => {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else Reflect.deleteProperty(globalThis, "document");
  });
  const writes: { path: string; method: string; body: unknown; signal?: AbortSignal }[] = [];
  const http: TmsHttpClient = {
    async mutate(path, method, body, signal) { writes.push({ path, method, body, signal }); return undefined as never; },
    async get() { throw new Error("unexpected read"); },
    async getResource() { throw new Error("unexpected resource read"); },
    async mutateResource() { throw new Error("unexpected resource write"); },
  };
  function Probe({ workspaceId, connected }: { workspaceId: string; connected: boolean }) {
    useMemberPresence(http, workspaceId, connected);
    return null;
  }
  const view = (workspaceId: string, connected = true) =>
    <Probe workspaceId={workspaceId} connected={connected} />;
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(view("one")); });
  assert.equal(writes.length, 0);
  assert.equal(interval, undefined);
  doc.visibilityState = "visible";
  await act(async () => { doc.dispatchEvent(new Event("visibilitychange")); win.dispatchEvent(new Event("focus")); });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, "/workspaces/one/actors/me/presence");
  assert.equal(writes[0].method, "POST");
  assert.deepEqual(writes[0].body, { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  now.mock.mockImplementation(() => 145000);
  await act(async () => { interval?.(); });
  assert.equal(writes.length, 2);
  doc.visibilityState = "hidden";
  await act(async () => { doc.dispatchEvent(new Event("visibilitychange")); });
  assert.equal(interval, undefined);
  assert.equal(writes[1].signal?.aborted, true);
  await act(async () => renderer.update(view("two")));
  doc.visibilityState = "visible";
  await act(async () => { doc.dispatchEvent(new Event("visibilitychange")); });
  assert.equal(writes[2].path, "/workspaces/two/actors/me/presence");
  await act(async () => renderer.update(view("two", false)));
  assert.equal(interval, undefined);
  await act(async () => renderer.unmount());
});
