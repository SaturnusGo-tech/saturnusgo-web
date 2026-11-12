import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react-test-renderer";
import { importHookFixture, nativeFile, project } from "./fixtures/import-hook-fixture";
import type { RepositoryFolder } from "../../../../folders/model/folder";

test("file selection finishes external preparation without original, folder or case writes", async t => {
  const h = await importHookFixture(); t.after(h.close);
  await act(async () => { await h.state().selectFile(new File(['[{"heading":"Case"}]'], "external.json")); });
  assert.deepEqual(h.counts(), { inspected: 1, normalized: 1 });
  assert.deepEqual(h.normalizedHints, [[]]);
  assert.equal(h.state().document?.testCases[0]?.title, "Prepared case");
  assert.equal(h.state().phase, "ready"); assert.equal(h.state().preparing, false);
  assert.equal(h.sourceSaves.length, 0); assert.equal(h.writes.length, 0);
  await act(async () => { await h.state().start(); });
  assert.equal(h.sourceSaves.length, 1); assert.equal(h.writes.length, 1);
  assert.deepEqual(h.counts(), { inspected: 1, normalized: 1 });
});

test("source architecture stays neutral while only the initial project prefills its selected folder", async t => {
  const folder = { id: "products", workspaceId: "w", projectId: "p", path: "/Products", archivedAt: null } as RepositoryFolder;
  const h = await importHookFixture({ initialFolder: folder }); t.after(h.close);
  await act(async () => { await h.state().selectFile(nativeFile(["First"], ["/Empty"])); });
  assert.equal(h.state().destination, "/Products");
  assert.deepEqual(h.state().sourcePlan?.folders.map(item => item.path), ["/Empty"]);
  assert.ok(h.state().plan?.folders.some(item => item.path === "/Products/Empty"));
  await act(async () => { await h.state().selectProject(project("q")); await h.state().selectProject(project("p")); });
  assert.equal(h.state().destination, "/");
});

test("rapid destination switches abort old folder reads without discarding the prepared file", async t => {
  const h = await importHookFixture({ delayedTargets: true }); t.after(h.close);
  await act(async () => { await h.state().selectFile(nativeFile()); });
  const document = h.state().document; let first!: Promise<void>, second!: Promise<void>;
  await act(async () => { first = h.state().selectProject(project("q")); });
  assert.equal(h.state().loadingTarget, true); assert.equal(h.state().document, document);
  await act(async () => { second = h.state().selectProject(project("r")); });
  assert.equal(h.targetRequests[0]?.signal.aborted, true);
  await act(async () => { h.targetRequests[1]?.resolve({ data: [], meta: { nextCursor: null } }); await second; });
  assert.equal(h.state().context?.scope.projectId, "r"); assert.equal(h.state().loadingTarget, false);
  await act(async () => { h.targetRequests[0]?.resolve({ data: [], meta: { nextCursor: null } }); await first; });
  assert.equal(h.state().targetProject.id, "r"); assert.equal(h.state().context?.scope.projectId, "r");
  assert.equal(h.state().document, document); assert.equal(h.sourceSaves.length, 0); assert.equal(h.writes.length, 0);
});

test("a queued confirmation cannot commit the previous target while or after a new target loads", async t => {
  const h = await importHookFixture({ delayedTargets: true }); t.after(h.close);
  await act(async () => { await h.state().selectFile(nativeFile()); });
  const queuedStart = h.state().start; let switchTarget!: Promise<void>;
  await act(async () => { switchTarget = h.state().selectProject(project("q")); await queuedStart(); });
  assert.equal(h.sourceSaves.length, 0); assert.equal(h.writes.length, 0);
  await act(async () => { h.targetRequests[0]?.resolve({ data: [], meta: { nextCursor: null } }); await switchTarget; });
  await act(async () => { await queuedStart(); });
  assert.equal(h.sourceSaves.length, 0); assert.equal(h.writes.length, 0);
  await act(async () => { await h.state().start(); });
  assert.equal(h.writes[0]?.body.projectId, "q");
});

test("commit clicks are guarded synchronously and partial retries keep target, source and command identities", async t => {
  const h = await importHookFixture({ failCaseOnce: true }); t.after(h.close);
  const file = nativeFile(["First", "Second", "Third"]);
  await act(async () => { await h.state().selectFile(file); await h.state().selectProject(project("q")); });
  await act(async () => { await Promise.all([h.state().start(), h.state().start()]); });
  assert.equal(h.state().phase, "partial"); assert.equal(h.state().completed, 2);
  assert.equal(h.sourceSaves.length, 1); assert.equal(h.writes.length, 3);
  await act(async () => { await h.state().selectProject(project("r")); h.state().setDestination("/Elsewhere"); await h.state().selectFile(nativeFile(["Other"])); });
  assert.equal(h.state().targetProject.id, "q"); assert.equal(h.state().destination, "/"); assert.equal(h.state().fileName, file.name);
  await act(async () => { await h.state().start(); });
  assert.equal(h.state().phase, "success"); assert.equal(h.state().completed, 3); assert.equal(h.writes.length, 4);
  assert.equal(h.writes[1]?.key, h.writes[3]?.key);
  assert.ok(h.sourceSaves.every(saved => saved.file === file && saved.projectId === "q"));
});

test("an empty-folder-only native package commits folders without manufacturing test cases", async t => {
  const h = await importHookFixture(); t.after(h.close);
  await act(async () => { await h.state().selectFile(nativeFile([], ["/Empty"])); });
  assert.equal(h.state().document?.testCases.length, 0); assert.equal(h.state().sourcePlan?.folders.length, 1);
  assert.equal(h.writes.length, 0); assert.equal(h.sourceSaves.length, 0);
  await act(async () => { await h.state().start(); });
  assert.equal(h.state().phase, "success"); assert.equal(h.state().completed, 0);
  assert.equal(h.writes.length, 1); assert.match(h.writes[0]?.path ?? "", /\/folders$/);
});

test("stopping an import retains confirmed saves and continuing skips those indices", async t => {
  const h = await importHookFixture({ stopAfterFirstCase: true }); t.after(h.close);
  await act(async () => { await h.state().selectFile(nativeFile(["First", "Second", "Third"])); });
  await act(async () => { await h.state().start(); });
  assert.equal(h.state().phase, "stopped"); assert.equal(h.state().completed, 1); assert.equal(h.writes.length, 1);
  await act(async () => { await h.state().start(); });
  assert.equal(h.state().phase, "success"); assert.equal(h.state().completed, 3); assert.equal(h.writes.length, 3);
  assert.deepEqual(h.writes.map(write => write.body.title), ["First", "Second", "Third"]);
});

test("a retained confirmation handler cannot restart a completed import", async t => {
  const h = await importHookFixture(); t.after(h.close);
  await act(async () => { await h.state().selectFile(nativeFile()); });
  const originalStart = h.state().start;
  await act(async () => { await originalStart(); });
  assert.equal(h.state().phase, "success");
  await act(async () => { await originalStart(); });
  assert.equal(h.sourceSaves.length, 1); assert.equal(h.writes.length, 1);
});

test("a prepared native file and empty folders survive changing the final project", async t => {
  const h = await importHookFixture(); t.after(h.close); const file = nativeFile(["First"], ["/Empty"]);
  await act(async () => { await h.state().selectFile(file); });
  const document = h.state().document;
  assert.ok(h.state().sourcePlan?.folders.some(folder => folder.path === "/Empty"));
  await act(async () => { await h.state().selectProject(project("q")); });
  assert.equal(h.state().document, document); assert.equal(h.state().targetProject.id, "q");
  assert.equal(h.state().destination, "/"); assert.equal(h.sourceSaves.length, 0); assert.equal(h.writes.length, 0);
  await act(async () => { await h.state().start(); });
  assert.equal(h.sourceSaves[0]?.file, file); assert.equal(h.sourceSaves[0]?.projectId, "q");
  assert.equal(h.writes.find(write => write.path === "/test-cases")?.body.projectId, "q");
  assert.deepEqual(h.refreshed, ["q"]);
});
