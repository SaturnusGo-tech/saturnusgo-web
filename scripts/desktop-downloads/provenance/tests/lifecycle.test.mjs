import assert from "node:assert/strict";
import { test } from "node:test";
import { createPublishingLifecycle } from "../publish.mjs";
import { fixture, fakeStore, metadata } from "../../retention/fixtures/store.mjs";
import { metadataKey } from "../../release/manifest.mjs";
const now = "2026-11-13T10:00:00.000Z";
function storeFixture() {
  const store = fakeStore(fixture());
  store.json = async key => {
    const match = /\/(releases|retired|uploads)\/([^/]+)\.json$/.exec(key);
    return store.snapshot[{ releases: "records", retired: "retired", uploads: "uploads" }[match[1]]][match[2]];
  };
  const put = store.putJson.bind(store);
  store.putJson = async (key, value) => {
    await put(key, value);
    const match = /\/(releases|retired|uploads)\/([^/]+)\.json$/.exec(key);
    store.snapshot[{ releases: "records", retired: "retired", uploads: "uploads" }[match[1]]][match[2]] = value;
  };
  return store;
}
test("publishing records upload intent, rejects retired versions and avoids overwriting provenance", async () => {
  const store = storeFixture(), lifecycle = createPublishingLifecycle({ store, now: () => now, log() {} });
  const release = metadata("0.2.13").release;
  await lifecycle.beforePublish(release); await lifecycle.beforePublish(release);
  assert.equal(store.written.length, 1);
  assert.equal(store.written[0].key, metadataKey("uploads", "0.2.13"));
  store.snapshot.retired["0.2.13"] = { schema: 1, version: "0.2.13", retiredAt: now };
  await assert.rejects(lifecycle.beforePublish(release), /retired/);
});
test("successful publication saves verified provenance and performs retirement without early deletion", async () => {
  const store = storeFixture(); delete store.snapshot.records["0.2.12"];
  const lifecycle = createPublishingLifecycle({ store, now: () => now, log() {} });
  await lifecycle.afterPublish(store.snapshot.latest);
  assert.equal(store.snapshot.records["0.2.12"].verification, "sha256");
  assert.equal(store.snapshot.retired["0.2.10"].retiredAt, now);
  assert.deepEqual(store.deleted, []);
});
