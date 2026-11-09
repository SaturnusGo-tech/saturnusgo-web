import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { act, create } from "react-test-renderer";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { notifyDefectsChanged } from "../../application/defect-resource-events";
import { useDefectIntake } from "../useDefectIntake";

test("visible refresh updates loaded pages without a loading flash or losing pagination", async () => {
  const fakeWindow = new EventTarget();
  const fakeDocument = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.assign(globalThis, { React });
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });
  Object.defineProperty(globalThis, "document", { configurable: true, value: fakeDocument });
  let current!: ReturnType<typeof useDefectIntake>;
  let tree: ReturnType<typeof create> | undefined;
  let title = "Initial";
  let accepted = false;
  let holdRefresh = false;
  let heldSignal: AbortSignal | null | undefined;
  let release: (() => void) | undefined;
  const cursors: Array<string | null> = [];
  const client = createTmsHttpClient({
    apiBase: "https://example.com/api/v1", credentials: "include", production: false,
    fetch: async (url, request) => {
      if (request?.method === "POST") {
        accepted = true;
        return Response.json({ data: { id: "first", projectId: "p", title, rowVersion: 2 } });
      }
      const cursor = new URL(String(url)).searchParams.get("cursor");
      cursors.push(cursor);
      const data = accepted && !cursor ? [] : [{ id: cursor ?? "first", projectId: "p", title, rowVersion: 1 }];
      const response = Response.json({ data,
        meta: { limit: 20, hasMore: true, nextCursor: cursor === "second" ? "third" : "second" } });
      if (holdRefresh) {
        holdRefresh = false;
        heldSignal = request?.signal;
        await new Promise<void>(resolve => { release = resolve; });
      }
      return response;
    },
  });
  function Probe() {
    current = useDefectIntake({ workspaceId: "w", projectId: "p" }, "inbox", () => undefined);
    return null;
  }
  try {
    await act(async () => {
      tree = create(<TmsHttpClientProvider client={client}><Probe /></TmsHttpClientProvider>);
    });
    await act(async () => { await current.load(current.list.nextCursor ?? undefined); });
    assert.deepEqual(cursors, [null, "second"]);
    assert.deepEqual(current.list.rows.map(row => row.title), ["Initial", "Initial"]);

    title = "Updated";
    fakeDocument.visibilityState = "hidden";
    await act(async () => { fakeWindow.dispatchEvent(new Event("focus")); });
    assert.deepEqual(cursors, [null, "second"]);

    fakeDocument.visibilityState = "visible";
    await act(async () => {
      fakeDocument.dispatchEvent(new Event("visibilitychange"));
      fakeWindow.dispatchEvent(new Event("focus"));
      assert.equal(current.list.loading, false);
    });
    assert.deepEqual(cursors, [null, "second", null, "second"]);
    assert.deepEqual(current.list.rows.map(row => row.title), ["Updated", "Updated"]);
    assert.equal(current.list.nextCursor, "third");

    holdRefresh = true;
    await act(async () => { notifyDefectsChanged("p"); });
    await act(async () => { assert.equal(await current.decide(current.list.rows[0]!, { action: "accept" }), true); });
    assert.equal(heldSignal?.aborted, true);
    await act(async () => release?.());
    assert.deepEqual(current.list.rows.map(row => row.id), ["second"]);
  } finally {
    act(() => tree?.unmount());
    if (previousReact) Object.defineProperty(globalThis, "React", previousReact);
    else Reflect.deleteProperty(globalThis, "React");
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});
