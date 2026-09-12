import test from "node:test";
import assert from "node:assert/strict";
import React, { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useImportCases } from "../../state/import/use-import-cases";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { Project } from "../../../../../../core/tms/contracts/legacy-contract";
(globalThis as unknown as { React: typeof React }).React = React;
const project = { id: "p", key: "P", name: "Project" } as Project;
const content = { title: "Case", description: "", preconditions: "", testData: "", component: "", type: "manual", lifecycle: "draft", priority: "medium", tags: [], estimatedMinutes: null, steps: [{ order: 1, action: "Act", expectedResult: "Result", testData: "", required: true }], checklist: [] };
async function harness(options: { issue?: boolean; failOnce?: boolean; delayed?: boolean } = {}) {
  let state!: ReturnType<typeof useImportCases>; let view!: ReactTestRenderer; let writes = 0; let normalizations = 0; let inspected = 0;
  let release: (() => void) | undefined;
  const http = { get: async () => ({ data: [], meta: { nextCursor: null } }),
    mutate: async (path: string) => {
      if (path.endsWith("inspect")) { inspected++; return { records: [{ path: "/0", value: {}, context: [] }] }; }
      normalizations++;
      if (options.delayed) await new Promise<void>(resolve => { release = resolve; });
      if (options.failOnce && normalizations === 1) throw new Error("Temporary processing failure");
      return options.issue ? { cases: [], issues: [{ sourcePath: "/0", code: "IMPORT_MAPPING_INVALID" }] }
        : { cases: [{ sourcePath: "/0", folderPath: "/", content, warnings: [] }], issues: [] };
    }, mutateResource: async () => { writes++; return { data: {}, etag: "1" }; } } as unknown as TmsHttpClient;
  function Probe() { state = useImportCases({ project, workspaceId: "w", folders: [], locale: "ru", onImported: async () => {} }); return null; }
  await act(async () => { view = create(createElement(TmsHttpClientProvider, { client: http, children: createElement(Probe) }) as unknown as Parameters<typeof create>[0]); });
  await act(async () => { await state.selectFile(new File(['[{"heading":"Case"}]'], "external.json")); });
  return { state: () => state, close: () => act(() => view.unmount()), counts: () => ({ writes, normalizations, inspected }), release: () => release?.() };
}
test("one import action automatically normalizes then saves without a review step", async () => {
  const h = await harness(); assert.equal(h.counts().normalizations, 0);
  await act(async () => { await h.state().start(); });
  assert.equal(h.state().phase, "success"); assert.equal(h.state().completed, 1);
  assert.deepEqual(h.counts(), { writes: 1, normalizations: 1, inspected: 1 }); h.close();
});
test("normalization issues never create zero-case success or partially exclude source records", async () => {
  const h = await harness({ issue: true });
  await act(async () => { await h.state().start(); });
  assert.equal(h.counts().writes, 0); assert.equal(h.state().locked, false);
  assert.match(h.state().error, /Ничего не импортировано/); assert.notEqual(h.state().phase, "success"); h.close();
});
test("retry reuses discovery after a temporary processing failure", async () => {
  const h = await harness({ failOnce: true });
  await act(async () => { await h.state().start(); }); assert.equal(h.counts().writes, 0);
  await act(async () => { await h.state().start(); });
  assert.equal(h.state().phase, "success"); assert.deepEqual(h.counts(), { writes: 1, normalizations: 2, inspected: 1 }); h.close();
});
test("stop and duplicate clicks during normalization cannot write late results", async () => {
  const h = await harness({ delayed: true }); let run!: Promise<void>;
  await act(async () => { run = h.state().start(); await Promise.resolve(); });
  await act(async () => { await h.state().start(); h.state().stop(); h.release(); await run; });
  assert.equal(h.counts().writes, 0); assert.equal(h.counts().normalizations, 1); h.close();
});
