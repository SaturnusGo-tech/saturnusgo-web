import assert from "node:assert/strict";
import test from "node:test";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { buildFile, tick } from "../../builds/tests/support/build-fixture";
import { editFixture } from "./support/run-edit-fixture";

test("editing loads current fields and existing build; cancelling never deletes the referenced file", async () => {
  const { store, f, loads } = editFixture(); await store.load();
  assert.equal(loads(), 1); assert.equal(store.snapshot().draft.name, "Release run");
  assert.equal(store.builds.current("project-a").artifact?.id, "existing-build"); assert.equal(store.dirty(), false);
  store.dispose(); await tick(); assert.deepEqual(f.removed, []);
});

test("only changed metadata is sent with fresh ETag; no assignee or execution fields are submitted", async () => {
  const { store, calls, f } = editFixture(); await store.load();
  store.patch({ name: "Changed title", ownerIdentityId: "person-b" });
  store.builds.setIosReference("project-a", "1.1 (101)");
  assert.ok(await store.save()); assert.equal(calls[0].etag, '"run:run-a:3"');
  assert.deepEqual(Object.keys(calls[0].patch).sort(), ["name", "ownerIdentityId", "platformBuilds"]);
  assert.equal(calls[0].patch.platformBuilds?.[0].platform, "android");
  store.dispose(); await tick(); assert.deepEqual(f.removed, []);
});

test("replacement cancellation cleans only new staged artifacts and clearing Android keeps old history", async () => {
  const { store, calls, f } = editFixture(); await store.load();
  store.builds.chooseFile("project-a", buildFile()); await tick(); assert.deepEqual(f.removed, []);
  store.builds.removeFile("project-a"); store.builds.setAndroidVersion("project-a", "");
  assert.ok(await store.save()); assert.deepEqual(calls[0].patch.platformBuilds, [{ platform: "ios", reference: "1.0 (100)" }]);
  store.dispose(); await tick(); assert.deepEqual(f.removed, ["artifact-project-a"]);
});

test("412 keeps the draft, blocks save and does not auto-fetch or overwrite; explicit reload replaces draft", async () => {
  const { store, loads, calls, f } = editFixture(async () => { throw new TmsApiError("Stale", 412, "request-a", "PRECONDITION_FAILED"); });
  await store.load(); store.patch({ description: "My edits" }); store.builds.chooseFile("project-a", buildFile()); await tick();
  assert.equal(await store.save(), null); assert.equal(store.snapshot().conflict, true);
  assert.equal(store.snapshot().draft.description, "My edits"); assert.equal(loads(), 1);
  assert.equal(await store.save(), null); assert.equal(calls.length, 1); assert.deepEqual(f.removed, []);
  await store.load(); await tick(); assert.equal(store.snapshot().draft.description, "Original notes");
  assert.deepEqual(f.removed, ["artifact-project-a"]); store.dispose();
});

test("lost response locks fields and retries the exact same operation; uncertain artifacts survive close", async () => {
  const { store, calls, f } = editFixture(async () => { throw new Error("Connection lost"); });
  await store.load(); store.patch({ name: "Correction" }); store.builds.chooseFile("project-a", buildFile()); await tick();
  assert.equal(await store.save(), null); assert.equal(store.snapshot().uncertain, true); assert.equal(store.fieldsEnabled(), false);
  store.patch({ name: "Must not silently start another command" }); assert.equal(store.snapshot().draft.name, "Correction");
  await store.save(); assert.equal(calls.length, 2); assert.equal(calls[0].key, calls[1].key); assert.deepEqual(calls[0], calls[1]);
  store.dispose(); await tick(); assert.deepEqual(f.removed, []);
});

test("definite rejection releases only the staged artifact and successful replacement retains it", async () => {
  const rejected = editFixture(async () => { throw new TmsApiError("Invalid", 400, "request-a", "VALIDATION_ERROR"); });
  await rejected.store.load(); rejected.store.builds.chooseFile("project-a", buildFile()); await tick();
  await rejected.store.save(); rejected.store.dispose(); await tick(); assert.deepEqual(rejected.f.removed, ["artifact-project-a"]);
  const saved = editFixture(); await saved.store.load(); saved.store.builds.chooseFile("project-a", buildFile()); await tick();
  assert.ok(await saved.store.save()); saved.store.dispose(); await tick(); assert.deepEqual(saved.f.removed, []);
});

test("terminal state fetched on open cannot be edited; duplicate tags are validated without a request", async () => {
  const { store, setCurrent, calls } = editFixture(); await store.load();
  store.patch({ tags: "same, same" }); assert.equal(await store.save(), null); assert.equal(calls.length, 0);
  const original = editFixture(); const resource = await original.port.load("run-a", new AbortController().signal);
  setCurrent({ ...resource, data: { ...resource.data, status: "completed" } });
  await store.load(); assert.equal(store.fieldsEnabled(), false); assert.equal(await store.save(), null); store.dispose();
});

test("a save completing after editor disposal retains the submitted file without refreshing an unrelated screen", async () => {
  let resolve!: (value: Awaited<ReturnType<ReturnType<typeof editFixture>["port"]["load"]>>) => void;
  const fixture = editFixture(() => new Promise(done => { resolve = done; }));
  const { store, f } = fixture; await store.load(); store.builds.chooseFile("project-a", buildFile()); await tick();
  const saving = store.save(); store.dispose(); await tick(); assert.deepEqual(f.removed, []);
  resolve(await fixture.port.load("run-a", new AbortController().signal));
  assert.equal(await saving, null); await tick(); assert.deepEqual(f.removed, []);
});
