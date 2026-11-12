import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react-test-renderer";
import { importHookFixture, nativeFile, project } from "./fixtures/import-hook-fixture";

test("stopped preparation ignores late responses and retries the retained checkpoint without writes", async t => {
  const h = await importHookFixture({ delayedNormalization: true }); t.after(h.close); let pending!: Promise<void>;
  const file = new File(['[{"heading":"Case"}]'], "external.json");
  await act(async () => { pending = h.state().selectFile(file); await h.normalizationStarted; });
  assert.equal(h.state().preparing, true);
  await act(async () => { await h.state().prepareAgain(); await h.state().start(); h.state().stop(); });
  assert.equal(h.state().preparing, false); assert.match(h.state().error, /Preparation stopped/);
  assert.equal(h.state().document, null); assert.equal(h.writes.length, 0); assert.equal(h.sourceSaves.length, 0);
  await act(async () => { await h.state().prepareAgain(); });
  assert.equal(h.state().phase, "ready"); assert.equal(h.state().document?.testCases[0]?.title, "Prepared case");
  assert.deepEqual(h.counts(), { inspected: 1, normalized: 2 });
  await act(async () => { h.releaseNormalization(); await pending; });
  assert.equal(h.state().phase, "ready"); assert.equal(h.writes.length, 0); assert.equal(h.sourceSaves.length, 0);
});

test("a replacement file wins over an older normalization response", async t => {
  const h = await importHookFixture({ delayedNormalization: true }); t.after(h.close); let pending!: Promise<void>;
  await act(async () => { pending = h.state().selectFile(new File(['[{"heading":"Old"}]'], "old.json")); await h.normalizationStarted; });
  await act(async () => { await h.state().selectFile(nativeFile(["Replacement"])); });
  await act(async () => { h.releaseNormalization(); await pending; });
  assert.equal(h.state().document?.testCases[0]?.title, "Replacement"); assert.equal(h.state().fileName, "native.json");
  assert.equal(h.state().phase, "ready"); assert.equal(h.writes.length, 0); assert.equal(h.sourceSaves.length, 0);
});

test("global workspace/project changes invalidate preparation and ignore its stale completion", async t => {
  const h = await importHookFixture({ delayedNormalization: true }); t.after(h.close); let pending!: Promise<void>;
  await act(async () => { pending = h.state().selectFile(new File(['[{"heading":"Old"}]'], "old.json")); await h.normalizationStarted; });
  await h.update({ workspaceId: "other-workspace", project: project("r") });
  await act(async () => { h.releaseNormalization(); await pending; });
  assert.equal(h.state().document, null); assert.equal(h.state().fileName, ""); assert.equal(h.state().preparing, false);
  assert.equal(h.state().targetProject.id, "r"); assert.equal(h.state().context?.scope.workspaceId, "other-workspace");
  assert.equal(h.sourceSaves.length, 0); assert.equal(h.writes.length, 0);
});

test("a file picker callback retained from an older project cannot revive that import session", async t => {
  const h = await importHookFixture(); t.after(h.close);
  const previousSelectFile = h.state().selectFile;
  await h.update({ project: project("q") });
  await act(async () => { await previousSelectFile(new File(['[{"heading":"Old"}]'], "old.json")); });
  assert.equal(h.state().document, null); assert.equal(h.state().fileName, "");
  assert.deepEqual(h.counts(), { inspected: 0, normalized: 0 });
  assert.equal(h.sourceSaves.length, 0); assert.equal(h.writes.length, 0);
});
