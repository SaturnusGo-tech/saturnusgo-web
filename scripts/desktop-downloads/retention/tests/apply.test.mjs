import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildPlan } from "../plan.mjs";
import { applyPlan } from "../apply.mjs";
import { withReleaseLock } from "../../release/lock.mjs";
import { fixture, fakeStore } from "../fixtures/store.mjs";
const now = "2026-11-13T10:00:00.000Z";
const eligible = () => {
  const snapshot = fixture();
  snapshot.retired["0.2.10"] = { schema: 1, version: "0.2.10", retiredAt: "2026-11-06T10:00:00.000Z" };
  return snapshot;
};
test("apply removes only reviewed keys after exact snapshot revalidation", async () => {
  const snapshot = eligible(), store = fakeStore(snapshot), plan = buildPlan({ snapshot, now });
  await applyPlan({ store, plan, now });
  assert.deepEqual(store.deleted, plan.delete.map(o => o.key));
  assert.ok(store.snapshot.objects.some(o => o.key.endsWith("latest.json")));
});
test("latest, object identity, and tampered actions each fail before deletion", async () => {
  for (const change of [s => { s.latest.version = "0.2.13"; }, s => { s.objects[0].etag = "changed"; }, () => {}]) {
    const snapshot = eligible(), plan = buildPlan({ snapshot, now }), store = fakeStore(snapshot);
    change(store.snapshot);
    if (store.snapshot.latest.version === "0.2.12" && store.snapshot.objects[0].etag !== "changed") plan.delete[0].key = "other/assets/logo.png";
    await assert.rejects(applyPlan({ store, plan, now }), /changed|plan|manifest/i);
    assert.deepEqual(store.deleted, []);
  }
});
test("a pointer race between deletions stops immediately", async () => {
  const snapshot = eligible(), plan = buildPlan({ snapshot, now }), store = fakeStore(snapshot);
  store.afterDelete = () => { store.snapshot.latest.version = "0.2.13"; };
  await assert.rejects(applyPlan({ store, plan, now }), /changed/i);
  assert.equal(store.deleted.length, 1);
});
test("retirement uses actual apply time and metadata failure prevents deletion", async () => {
  const snapshot = fixture(), plan = buildPlan({ snapshot, now }), store = fakeStore(snapshot);
  await applyPlan({ store, plan, now: "2026-11-13T10:30:00.000Z" });
  assert.equal(store.written[0].value.retiredAt, "2026-11-13T10:30:00.000Z");
  const failed = fakeStore(fixture()); failed.putJson = async () => { throw Error("write failed"); };
  await assert.rejects(applyPlan({ store: failed, plan, now }), /write failed/);
  assert.deepEqual(failed.deleted, []);
});
test("host-wide lock refuses overlapping publishers/cleanup and releases after errors", async t => {
  const parent = await mkdtemp(join(tmpdir(), "falcon-lock-test-")); t.after(() => rm(parent, { recursive: true, force: true }));
  const path = join(parent, "writer.lock"); let release;
  const first = withReleaseLock(() => new Promise(done => { release = done; }), { path });
  while (!release) await new Promise(done => setTimeout(done, 1));
  await assert.rejects(withReleaseLock(async () => {}, { path }), /locked/i);
  release(); await first;
  await assert.rejects(withReleaseLock(async () => { throw Error("failed"); }, { path }), /failed/);
  await withReleaseLock(async () => {}, { path });
});
test("a partial delete failure can be replanned for only the surviving retired objects", async () => {
  const snapshot = eligible(), plan = buildPlan({ snapshot, now }), store = fakeStore(snapshot);
  const remove = store.remove.bind(store); let calls = 0;
  store.remove = async key => { if (++calls === 2) throw Error("delete failed"); await remove(key); };
  await assert.rejects(applyPlan({ store, plan, now }), /delete failed/);
  const remaining = buildPlan({ snapshot: store.snapshot, now });
  assert.equal(remaining.delete.length, 3);
});
