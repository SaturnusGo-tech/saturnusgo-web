import assert from "node:assert/strict";
import test from "node:test";
import type { SharedStep, SharedStepSummary } from "../../model/shared-step";
import { deferred, draft, shared, stateHarness, summary } from "./harness";

test("late catalog and resource responses cannot cross projects or seed the new project cache", async t => {
  const oldList = deferred<SharedStepSummary[]>(), oldRead = deferred<SharedStep>();
  const reads: string[] = [];
  let oldSignal: AbortSignal | undefined;
  const h = stateHarness({ listSharedSteps: (_http: unknown, project: string) => project === "a" ? oldList.promise : Promise.resolve([summary("b", "b")]),
    getSharedStep: (_http: unknown, project: string, id: string, signal: AbortSignal) => {
      reads.push(project); if (project === "a") oldSignal = signal;
      return project === "a" ? oldRead.promise : Promise.resolve(shared(id, project));
    } });
  t.after(h.dispose);
  const first = h.render(); const pending = first.open("same-id");
  h.context("b"); h.render(); await Promise.resolve();
  assert.equal(oldSignal?.aborted, true);
  oldRead.resolve(shared("same-id", "a")); oldList.resolve([summary("old", "a")]);
  assert.equal(await pending, null);
  assert.deepEqual(h.render().items.map(item => item.projectId), ["b"]);
  assert.equal(h.render().selected, null);
  assert.equal((await h.render().resolve("same-id"))?.projectId, "b");
  assert.deepEqual(reads, ["a", "b"]);
});

test("newer refresh wins even when an older refresh fails later", async t => {
  const old = deferred<SharedStepSummary[]>(); let calls = 0;
  const h = stateHarness({ listSharedSteps: () => ++calls === 1 ? old.promise : Promise.resolve([summary("new")]) }); t.after(h.dispose);
  h.render(); await h.render().refresh(); old.reject(new Error("old request failed")); await Promise.resolve();
  assert.deepEqual(h.render().items.map(item => item.id), ["new"]);
  assert.equal(h.render().status, "ready");
});

test("rapid resource changes and closing a pending resource do not cache or reopen superseded selections", async t => {
  const first = deferred<SharedStep>(); let calls = 0;
  const h = stateHarness({ getSharedStep: (_http: unknown, project: string, id: string) => ++calls === 1 ? first.promise : Promise.resolve(shared(id, project)) }); t.after(h.dispose);
  h.render(); const pending = h.render().open("first");
  await h.render().open("second"); first.resolve(shared("first"));
  assert.equal(await pending, null);
  assert.equal(h.render().selected?.id, "second");
  await h.render().resolve("first"); assert.equal(calls, 3);
  const delayed = deferred<SharedStep>();
  const close = stateHarness({ getSharedStep: () => delayed.promise }); t.after(close.dispose);
  close.render(); const opening = close.render().open("later"); close.render().close(); delayed.resolve(shared("later"));
  assert.equal(await opening, null); assert.equal(close.render().selected, null); assert.equal(close.render().status, "ready");
});

test("an older reload cannot overwrite a newer saved revision or its cache", async t => {
  const old = deferred<SharedStep>(); let reads = 0;
  const h = stateHarness({ getSharedStep: () => ++reads === 1 ? old.promise : Promise.resolve(shared("case", "a", 2)) }); t.after(h.dispose);
  h.render(); const pending = h.render().reload("case");
  await h.render().save(draft, shared("case"));
  old.resolve(shared("case"));
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(h.render().selected?.currentRevision, 2);
  assert.equal((await h.render().resolve("case"))?.currentRevision, 2);
});

test("late save completion cannot select, cache, or reset saving state in another project", async t => {
  const saving = deferred<SharedStep>();
  const h = stateHarness({ createSharedStep: () => saving.promise }); t.after(h.dispose);
  h.render(); const pending = h.render().save(draft);
  h.context("b"); h.render(); saving.resolve(shared("created", "a", 2));
  assert.equal(await pending, null);
  assert.equal(h.render().selected, null); assert.equal(h.render().saving, false);
});

test("demo saves project-scoped folder IDs and paths on both detail and catalog summaries", async t => {
  const h = stateHarness(); t.after(h.dispose);
  h.context("a", "demo", [{ id: "folder", projectId: "a", path: "/Authentication/SSO", archivedAt: null }]); h.render();
  const saved = await h.render().save({ ...draft, folderId: "folder" });
  assert.equal(saved?.folderId, "folder"); assert.equal(saved?.folderPath, "/Authentication/SSO");
  assert.equal(h.render().items[0]?.folderPath, "/Authentication/SSO");
  assert.equal((await h.render().resolve(saved!.id))?.folderId, "folder");
  const revised = await h.render().save({ ...draft, folderId: undefined }, saved);
  assert.equal(revised?.folderId, "folder"); assert.equal(revised?.folderPath, "/Authentication/SSO");
  await assert.rejects(h.render().save({ ...draft, folderId: "missing" }), /folder/i);
});

test("failed saves release the synchronous duplicate guard so the same operation can be retried", async t => {
  const first = deferred<SharedStep>(); const keys: string[] = [];
  const h = stateHarness({ createSharedStep: (_http: unknown, _project: string, _draft: unknown, key: string) => {
    keys.push(key); return keys.length === 1 ? first.promise : Promise.resolve(shared("created"));
  } }); t.after(h.dispose);
  h.render(); const saving = h.render().save(draft, null, "stable-operation");
  assert.equal(await h.render().save(draft, null, "duplicate"), null);
  first.reject(new Error("retryable")); await assert.rejects(saving, /retryable/);
  assert.equal(h.render().saving, false);
  assert.equal((await h.render().save(draft, null, "stable-operation"))?.id, "created");
  assert.deepEqual(keys, ["stable-operation", "stable-operation"]);
});

test("callbacks retained from the old project cannot close a new project selection", async t => {
  const h = stateHarness(); t.after(h.dispose);
  const old = h.render(); h.context("b"); h.render(); await h.render().open("new");
  old.close(); await assert.rejects(old.reload("old"), { name: "AbortError" });
  assert.equal(h.render().selected?.id, "new");
});

test("archiving during catalog refresh settles loading and prevents the old catalog from restoring the item", async t => {
  const old = deferred<SharedStepSummary[]>();
  const h = stateHarness({ listSharedSteps: () => old.promise,
    archiveSharedStep: async () => ({ ...shared("archived"), archivedAt: "2026-11-13" }) }); t.after(h.dispose);
  h.render(); assert.equal(await h.render().archive(summary("archived"), "archive-operation"), "success");
  old.resolve([summary("archived")]); await Promise.resolve();
  assert.equal(h.render().status, "ready"); assert.equal(h.render().items.length, 0);
});
