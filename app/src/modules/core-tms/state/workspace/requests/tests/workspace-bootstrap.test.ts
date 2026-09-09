import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import type { Bootstrap } from "../../../../../../core/tms/contracts/legacy-contract";
import { createWorkspaceShell, fallbackBootstrap } from "../../../../../../core/tms/fallback/bootstrap";
import { mergeProjectCollections, type ProjectCollections } from "../project-collections";
import { createWorkspaceRequests } from "../workspace-requests";

type Model = ReturnType<typeof import("../../useWorkspaceBootstrap").useWorkspaceBootstrap>;
function collections(projectId: string, version: string): ProjectCollections {
  return { testCases: [], runs: [], suites: [], defects: [], externalLinks: [], environments: [{
    id: `${projectId}-${version}`, projectId, key: version, name: version, baseUrl: "", description: "", isDefault: false,
  }] };
}
function harness() {
  const pending: { projectId: string; signal: AbortSignal; resolve: (data: ProjectCollections) => void; reject: (error: Error) => void }[] = [];
  const states: unknown[] = [];
  const effects: (() => void | (() => void))[] = [];
  const module = { exports: {} as { useWorkspaceBootstrap: () => Model } };
  const source = readFileSync(new URL("../../useWorkspaceBootstrap.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, {
    module, exports: module.exports, AbortController, process: { env: { NODE_ENV: "test" } },
    require(name: string) {
      if (name === "react") return {
        useCallback: (fn: unknown) => fn, useRef: (current: unknown) => ({ current }),
        useEffect: (effect: () => void | (() => void)) => effects.push(effect),
        useState(initial: unknown) {
          const index = states.length; states.push(typeof initial === "function" ? initial() : initial);
          return [states[index], (value: unknown) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
        },
      };
      if (name.endsWith("fallback/bootstrap")) return { createWorkspaceShell, fallbackBootstrap };
      if (name.endsWith("transport/http")) return { TmsApiError: Error };
      if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
      if (name.endsWith("case-deep-link")) return { readCaseDeepLink: () => ({}) };
      if (name.endsWith("workspace-requests")) return { createWorkspaceRequests };
      if (name.endsWith("project-collections")) return { mergeProjectCollections };
      if (name.endsWith("projects/data/project-api")) return { getProject: async (_http: unknown, id: string) => ({ data: { id, key: id, name: id } }) };
      if (name.endsWith("workspace-api")) return {
        loadProjectCollections: (_http: unknown, projectId: string, signal: AbortSignal) => new Promise<ProjectCollections>((resolve, reject) => pending.push({ projectId, signal, resolve, reject })),
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const model = module.exports.useWorkspaceBootstrap();
  return { model, pending, data: () => states[0] as Bootstrap, unmount: () => { const cleanup = effects[0](); if (cleanup) cleanup(); } };
}

test("a completed folder mutation cannot abort an in-flight project switch", async () => {
  const h = harness();
  const navigation = h.model.loadProject("project-b");
  assert.equal(await h.model.refreshProject("project-a"), null);
  assert.equal(h.pending.length, 1);
  assert.equal(h.pending[0].signal.aborted, false);
  h.pending[0].resolve(collections("project-b", "selected"));
  assert.ok(await navigation);
  assert.equal(h.data().environments[0].projectId, "project-b");
});

test("late mutation refresh is ignored after navigation even if the server ignores cancellation", async () => {
  const h = harness();
  const refresh = h.model.refreshProject("project-a");
  const navigation = h.model.loadProject("project-b");
  assert.equal(h.pending[0].signal.aborted, true);
  h.pending[1].resolve(collections("project-b", "selected"));
  await navigation;
  h.pending[0].resolve(collections("project-a", "stale"));
  assert.equal(await refresh, null);
  assert.deepEqual(h.data().environments.map((item) => item.id), ["project-b-selected"]);
});

test("newest refresh wins and preserves the other project's cached collections", async () => {
  const h = harness();
  h.model.setData((current) => ({ ...current, environments: collections("project-b", "cached").environments }));
  const first = h.model.refreshProject("project-a");
  const second = h.model.refreshProject("project-a");
  h.pending[1].resolve(collections("project-a", "new"));
  assert.ok(await second);
  h.pending[0].resolve(collections("project-a", "old"));
  assert.equal(await first, null);
  assert.deepEqual(h.data().environments.map((item) => item.id), ["project-b-cached", "project-a-new"]);
});

test("unmount cancels background requests and stale responses cannot replace data", async () => {
  const h = harness();
  const refresh = h.model.refreshProject("project-a");
  h.unmount();
  assert.equal(h.pending[0].signal.aborted, true);
  h.pending[0].resolve(collections("project-a", "stale"));
  assert.equal(await refresh, null);
  assert.equal(h.data().environments.length, 0);
});

test("refresh failure preserves the loaded workspace and permits a later retry", async () => {
  const h = harness();
  const first = h.model.refreshProject("project-a");
  h.pending[0].reject(new Error("unavailable"));
  assert.equal(await first, null);
  const retry = h.model.refreshProject("project-a");
  h.pending[1].resolve(collections("project-a", "retry"));
  assert.ok(await retry);
  assert.equal(h.data().environments[0].id, "project-a-retry");
});

test("mutation guards detect navigation before project state commits", () => {
  const requests = createWorkspaceRequests();
  const before = requests.captureNavigationGuard();
  assert.equal(before(), true);
  const navigation = requests.beginNavigation();
  const during = requests.captureNavigationGuard();
  assert.equal(before(), false);
  assert.equal(during(), false);
  navigation.finish();
  assert.equal(before(), false);
  assert.equal(during(), false);
  const after = requests.captureNavigationGuard();
  assert.equal(after(), true);
  requests.cancel();
  assert.equal(after(), false);
});
