import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { useProductDocDraftSession } from "../useProductDocDraftSession";
import { useBufferedProductDocDraft } from "../../buffer/useBufferedProductDocDraft";
import { productDocDraftKey, type ProductDocDraftBuffer } from "../../draft-buffer";
import { requestAuthoringLeave } from "../../../../../authoring/leave/application/authoring-leave";
import type { ProductDocsApi } from "../../../../domain/product-docs";
const scope = { workspaceId: "w", projectId: "p" };
const key = productDocDraftKey(scope, "doc");
const baseline = { title: "Original", sections: [], version: 1 };
const sections: [] = [];
const titleHighlights: [] = [];
function storage() {
  const values = new Map<string, string>();
  return { values, getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
function fixture(api: Pick<ProductDocsApi, "save">) {
  const disk = storage(), priorWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: disk } });
  let title = "Original", drafts!: ProductDocDraftBuffer, dirty = false;
  const notices: string[] = [];
  function Editor() {
    drafts = useProductDocDraftSession({ api: api as ProductDocsApi, enabled: true, scope, ownerId: "alice", locale: "en", notify: text => notices.push(text) });
    const buffered = useBufferedProductDocDraft(drafts, key, baseline, { title, sections, titleHighlights });
    dirty = buffered.dirty;
    return null;
  }
  let root!: ReturnType<typeof create>;
  act(() => { root = create(<Editor />); });
  return { disk, notices, buffer: () => drafts, dirty: () => dirty,
    edit(next: string) { title = next; act(() => { root.update(<Editor />); }); },
    dispose() { act(() => root.unmount()); Object.defineProperty(globalThis, "window", { configurable: true, value: priorWindow }); } };
}
test("internal navigation waits for the server draft and acknowledgement leaves no phantom dirty buffer", async t => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const calls: string[] = [];
  const f = fixture({ async save(_scope, _id, input) { calls.push(input.title); await pending; return { draftVersion: 2 }; } });
  t.after(f.dispose); assert.equal(f.buffer().size, 0);
  f.edit("Changed"); assert.equal(f.buffer().size, 1); assert.equal(f.disk.values.size, 1);
  let navigated = false, leaving!: Promise<boolean>;
  act(() => { leaving = requestAuthoringLeave(() => { navigated = true; }); });
  assert.equal(navigated, false); assert.deepEqual(calls, ["Changed"]);
  await act(async () => { release(); assert.equal(await leaving, true); });
  assert.equal(navigated, true); assert.equal(f.buffer().size, 0); assert.equal(f.dirty(), false);
  assert.equal(f.disk.values.size, 0);
  f.edit("Second"); await act(async () => { assert.equal(await f.buffer().flush!(), true); });
  assert.deepEqual(calls, ["Changed", "Second"]); assert.equal(f.dirty(), false);
});
test("offline navigation stays on the document and its next edit can retry", async t => {
  let fail = true, navigated = false;
  const f = fixture({ async save() { if (fail) throw new Error("Offline"); return { draftVersion: 2 }; } });
  t.after(f.dispose); f.edit("Keep me");
  await act(async () => { assert.equal(await requestAuthoringLeave(() => { navigated = true; }), false); });
  assert.equal(navigated, false); assert.equal(f.buffer().get(key)?.title, "Keep me"); assert.equal(f.notices.length, 1);
  fail = false; f.edit("Retry me");
  await act(async () => { assert.equal(await requestAuthoringLeave(() => { navigated = true; }), true); });
  assert.equal(navigated, true); assert.equal(f.dirty(), false);
});
test("new text typed during an in-flight save remains visible and is flushed at the next server version", async t => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const calls: [string, number][] = [];
  const f = fixture({ async save(_scope, _id, input) {
    calls.push([input.title, input.expectedDraftVersion]);
    if (calls.length === 1) await pending;
    return { draftVersion: input.expectedDraftVersion + 1 };
  } });
  t.after(f.dispose); f.edit("First");
  let saving!: Promise<boolean>;
  act(() => { saving = f.buffer().flush!(); });
  f.edit("Latest");
  await act(async () => { release(); assert.equal(await saving, true); });
  assert.deepEqual(calls, [["First", 1], ["Latest", 2]]);
  assert.equal(f.dirty(), false); assert.equal(f.buffer().size, 0);
});
test("typing is debounced and the draft reaches the server without a navigation action", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const calls: string[] = [];
  const f = fixture({ async save(_scope, _id, input) { calls.push(input.title); return { draftVersion: 2 }; } });
  t.after(f.dispose); f.edit("First");
  await act(async () => { t.mock.timers.tick(900); });
  assert.equal(calls.length, 0); f.edit("Latest");
  await act(async () => { t.mock.timers.tick(999); });
  assert.equal(calls.length, 0);
  await act(async () => { t.mock.timers.tick(1); });
  assert.deepEqual(calls, ["Latest"]); assert.equal(f.dirty(), false); assert.equal(f.buffer().size, 0);
});
test("an untouched document with absent optional title formatting is clean", () => {
  const drafts: ProductDocDraftBuffer = new Map();
  let dirty = true;
  function Editor() {
    dirty = useBufferedProductDocDraft(drafts, key, baseline, { title: baseline.title, sections }).dirty;
    return null;
  }
  let root!: ReturnType<typeof create>;
  act(() => { root = create(<Editor />); });
  try { assert.equal(dirty, false); assert.equal(drafts.size, 0); }
  finally { act(() => root.unmount()); }
});
test("browser storage failure warns once while live edits can still reach the server", async t => {
  const f = fixture({ async save() { return { draftVersion: 2 }; } });
  t.after(f.dispose);
  f.disk.setItem = () => { throw new Error("Quota exceeded"); };
  f.edit("First"); f.edit("Latest");
  assert.equal(f.notices.length, 1); assert.match(f.notices[0], /Local recovery is unavailable/);
  assert.equal(f.buffer().get(key)?.title, "Latest");
  await act(async () => { assert.equal(await f.buffer().flush!(), true); });
  assert.equal(f.dirty(), false);
});
