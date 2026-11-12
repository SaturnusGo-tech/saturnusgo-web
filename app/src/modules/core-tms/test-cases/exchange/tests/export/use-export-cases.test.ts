import assert from "node:assert/strict";
import test from "node:test";
import type { useExportCases } from "../../state/export/use-export-cases";
import { exportProjectCases } from "../../application/export-project-cases";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";

const first = { id: "a", key: "ALPHA", name: "Alpha" }, second = { id: "b", key: "BETA", name: "Beta" };
function deferred() {
  let resolve!: (value: unknown) => void, reject!: (reason: Error) => void;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture(t: { after(fn: () => void): void }) {
  const h = componentHarness(undefined, { Blob, Error });
  const contexts: { projectId: string; signal: AbortSignal; pending: ReturnType<typeof deferred> }[] = [];
  const exports: { projectId: string; signal: AbortSignal; pending: ReturnType<typeof deferred> }[] = [];
  const downloads: string[] = [];
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:export"; URL.revokeObjectURL = () => {};
  Object.assign(h.window, { document: { createElement: () => {
    const anchor = { href: "", download: "", click() { downloads.push(anchor.download); } }; return anchor;
  } } });
  t.after(() => { h.dispose(); URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; });
  const { useExportCases: useExport } = h.load<{ useExportCases: typeof useExportCases }>(new URL("../../state/export/use-export-cases.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("import-context")) return { loadImportContext: (_http: unknown, projectId: string, signal: AbortSignal) => {
      const pending = deferred(); contexts.push({ projectId, signal, pending }); return pending.promise;
    } };
    if (name.endsWith("export-project-cases")) return { exportProjectCases: (_http: unknown, project: typeof first, signal: AbortSignal) => {
      const pending = deferred(); exports.push({ projectId: project.id, signal, pending }); return pending.promise;
    } };
  });
  const http = {};
  let project = first, enabled = true;
  const render = () => h.render(() => useExport(project, enabled));
  return { contexts, exports, downloads, render, choose(value: typeof first) { project = value; render(); return render(); },
    disable() { enabled = false; render(); return render(); }, dispose: h.dispose };
}
const document = { testCases: [{ title: "Original" }] };
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test("rapid presses share one export and one download", async t => {
  const f = fixture(t), state = f.render();
  const request = state.start(), duplicate = state.start();
  assert.equal(f.contexts.length, 1);
  f.contexts[0].pending.resolve({ folders: [] }); await flush();
  assert.equal(f.exports.length, 1); f.exports[0].pending.resolve(document);
  await Promise.all([request, duplicate]);
  assert.deepEqual(f.downloads, ["alpha-test-cases.json"]);
  assert.equal(f.render().completed, 1); assert.equal(f.render().busy, false);
});

test("a late old-project context never starts an export or updates the new project", async t => {
  const f = fixture(t), request = f.render().start();
  const current = f.choose(second); assert.equal(f.contexts[0].signal.aborted, true);
  assert.equal(current.busy, false); assert.equal(current.completed, null);
  f.contexts[0].pending.resolve({ folders: [] }); await request;
  assert.equal(f.exports.length, 0); assert.deepEqual(f.downloads, []);
  assert.equal(f.render().error, "");
});

test("cancelled late results cannot download or clear the replacement request", async t => {
  const f = fixture(t); const old = f.render().start();
  f.contexts[0].pending.resolve({ folders: [] }); await flush();
  f.render().cancel(); const replacement = f.render().start();
  f.contexts[1].pending.resolve({ folders: [] }); await flush();
  f.exports[0].pending.resolve(document); await old;
  assert.deepEqual(f.downloads, []); assert.equal(f.render().busy, true); assert.equal(f.render().completed, null);
  f.exports[1].pending.resolve(document); await replacement;
  assert.deepEqual(f.downloads, ["alpha-test-cases.json"]); assert.equal(f.render().busy, false);
});

test("disabling aborts pending work and hides late failures", async t => {
  const f = fixture(t); const pending = f.render().start();
  f.contexts[0].pending.resolve({ folders: [] }); await flush();
  f.disable(); assert.equal(f.exports[0].signal.aborted, true);
  f.exports[0].pending.reject(new Error("Old project failure")); await pending;
  assert.equal(f.render().error, ""); assert.equal(f.render().busy, false);
});

test("unmounting aborts context loading before any export or download", async t => {
  const other = fixture(t); const unmounted = other.render().start(); other.dispose();
  other.contexts[0].pending.resolve({ folders: [] }); await unmounted;
  assert.equal(other.exports.length, 0); assert.deepEqual(other.downloads, []);
});


test("switching projects during export ignores the old result and downloads only the new selection", async t => {
  const f = fixture(t); const old = f.render().start();
  f.contexts[0].pending.resolve({ folders: [] }); await flush();
  f.choose(second); assert.equal(f.exports[0].signal.aborted, true);
  const current = f.render().start(); f.contexts[1].pending.resolve({ folders: [] }); await flush();
  f.exports[0].pending.resolve(document); await old;
  assert.deepEqual(f.downloads, []); assert.equal(f.render().busy, true); assert.equal(f.render().completed, null);
  f.exports[1].pending.resolve(document); await current;
  assert.deepEqual(f.downloads, ["beta-test-cases.json"]); assert.equal(f.render().completed, 1);
});

test("an active failure releases the request for a retry in the same selected project", async t => {
  const f = fixture(t); f.choose(second); const failed = f.render().start();
  f.contexts[0].pending.reject(new Error("Please reconnect and retry.")); await failed;
  assert.equal(f.render().busy, false); assert.equal(f.render().error, "Please reconnect and retry.");
  const retry = f.render().start(); assert.equal(f.contexts[1].projectId, "b");
  f.contexts[1].pending.resolve({ folders: [] }); await flush(); f.exports[0].pending.resolve(document); await retry;
  assert.equal(f.render().error, ""); assert.deepEqual(f.downloads, ["beta-test-cases.json"]);
});


test("export rejects details from another project or a different case ID", async () => {
  for (const mismatch of [{ id: "case-1", projectId: "foreign" }, { id: "other-case", projectId: "a" }]) {
    const http = { get: async () => ({ data: [{ id: "case-1" }], meta: { nextCursor: null } }),
      getResource: async () => ({ data: { ...mismatch, key: "A-1", folderPath: "/", current: {
        title: "Case", description: "", tags: [], steps: [], checklist: [],
      } } }) } as unknown as TmsHttpClient;
    await assert.rejects(exportProjectCases(http, first), /selected project/i);
  }
});
