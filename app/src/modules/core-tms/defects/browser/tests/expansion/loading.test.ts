import test from "node:test";
import assert from "node:assert/strict";
import { DefectBrowserController } from "../../application/DefectBrowserController";
import type { DefectBrowserSource } from "../../model/defect-browser";
const tick = () => new Promise<void>(resolve => setImmediate(resolve));

test("opening hundreds of folders limits requests, deduplicates the queue and keeps pagination bounded", async () => {
  const calls: { component: string; finish: () => void; signal: AbortSignal }[] = [];
  const source: DefectBrowserSource = {
    groups: async () => ({ groups: [], totals: { total: 200, open: 200, critical: 0 }, groupCount: 200, nextCursor: null }),
    records: (_query, component, _cursor, signal) => new Promise(resolve => {
      calls.push({ component, signal, finish: () => resolve({ items: [], nextCursor: "page-2" }) });
    }),
  };
  const controller = new DefectBrowserController(source);
  controller.configure("a", { projectId: "a", q: "" });
  for (let i = 0; i < 200; i++) { controller.openComponent(String(i)); controller.openComponent(String(i)); }
  assert.equal(calls.length, 4);
  let completed = 0;
  while (completed < 200) {
    const batch = calls.slice(completed); assert.ok(batch.length <= 4);
    batch.forEach(call => call.finish()); completed += batch.length; await tick();
  }
  assert.equal(calls.length, 200);
  assert.equal(new Set(calls.map(call => call.component)).size, 200);
  assert.equal(Object.keys(controller.getState().branches).length, 200);
  assert.equal(controller.getState().branches["199"].hasMore, true);
  controller.reset();
});

test("changing project aborts active loads and discards folders still waiting in the queue", async () => {
  const calls: { projectId: string; signal: AbortSignal; finish: () => void }[] = [];
  const source: DefectBrowserSource = {
    groups: async () => ({ groups: [], totals: { total: 0, open: 0, critical: 0 }, groupCount: 0, nextCursor: null }),
    records: (query, _component, _cursor, signal) => new Promise(resolve => {
      calls.push({ projectId: query.projectId, signal, finish: () => resolve({ items: [], nextCursor: null }) });
    }),
  };
  const controller = new DefectBrowserController(source);
  controller.configure("a", { projectId: "a", q: "" });
  for (let i = 0; i < 20; i++) controller.openComponent(String(i));
  controller.configure("b", { projectId: "b", q: "" });
  calls.forEach(call => { assert.equal(call.signal.aborted, true); call.finish(); });
  await tick(); assert.equal(calls.length, 4);
  assert.deepEqual(Object.keys(controller.getState().branches), []);
  controller.openComponent("New"); assert.equal(calls[4].projectId, "b");
  calls[4].finish(); await tick();
  assert.deepEqual(Object.keys(controller.getState().branches), ["New"]);
  controller.reset();
});
