import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import type { Bootstrap, Project, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { createWorkspaceShell, fallbackBootstrap } from "../../../../../core/tms/fallback/bootstrap";
import { mergeProjectCollections, type ProjectCollections } from "../../workspace/requests/project-collections";
import { createWorkspaceRequests } from "../../workspace/requests/workspace-requests";
import { resolveSelectedCase } from "../../../test-cases/navigation/selection/selected-case";

type Pending<T> = { id: string; signal: AbortSignal; resolve: (value: T) => void; reject: (error: Error) => void };
const emptyCollections: ProjectCollections = { testCases: [], runs: [], suites: [], environments: [], defects: [], externalLinks: [] };
const pay: Project = { id: "pay", key: "PAY", name: "Переводы между счетами", status: "active" };

function harness() {
  const slots: unknown[] = [];
  const metadata: Pending<{ data: Project; etag: string }>[] = [];
  const collections: Pending<ProjectCollections>[] = [];
  const screens: { project: string | undefined; cases: string[] }[] = [];
  const memory = new Map<string, string>();
  const window = { localStorage: { setItem: (key: string, value: string) => memory.set(key, value) } };
  function require(name: string): unknown {
    if (name === "react") return {
      useRef: (current: unknown) => ({ current }), useCallback: (fn: unknown) => fn,
      useMemo: (fn: () => unknown) => fn(), useEffect: () => undefined,
      useState(initial: unknown) {
        const index = slots.length; slots.push(typeof initial === "function" ? initial() : initial);
        return [slots[index], (value: unknown) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
      },
    };
    if (name.endsWith("fallback/bootstrap")) return { createWorkspaceShell, fallbackBootstrap };
    if (name.endsWith("transport/http")) return { TmsApiError: Error };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("case-deep-link")) return { readCaseDeepLink: () => ({}) };
    if (name.endsWith("workspace-requests")) return { createWorkspaceRequests };
    if (name.endsWith("project-collections")) return { mergeProjectCollections };
    if (name.endsWith("selected-case")) return { resolveSelectedCase };
    if (name.endsWith("workspace-api")) return {
      loadProjectCollections: (_http: unknown, id: string, signal: AbortSignal) => new Promise<ProjectCollections>((resolve, reject) => collections.push({ id, signal, resolve, reject })),
    };
    if (name.endsWith("projects/data/project-api")) return {
      getProject: (_http: unknown, id: string, signal: AbortSignal) => new Promise<{ data: Project; etag: string }>((resolve, reject) => metadata.push({ id, signal, resolve, reject })),
    };
    if (name === "react/jsx-runtime") return { jsx: (type: unknown, props: unknown) => ({ type, props }) };
    if (name.endsWith("usePortfolioRoute")) return { usePortfolioRoute: () => ({ route: { kind: "catalog" }, navigate() {} }) };
    if (name.endsWith("WorkspaceCasesStage")) return { WorkspaceCasesStage: "WorkspaceCasesStage" };
    if (name.endsWith("PortfoliosView")) return { PortfoliosView: "PortfoliosView" };
    throw new Error(`Unexpected import ${name}`);
  }
  function compile<T>(path: string): T {
    const module = { exports: {} };
    runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, { module, exports: module.exports, require, window, AbortController, process: { env: { NODE_ENV: "test" } } });
    return module.exports as T;
  }
  const bootstrap = compile<typeof import("../../workspace/useWorkspaceBootstrap")>("../../workspace/useWorkspaceBootstrap.ts").useWorkspaceBootstrap();
  bootstrap.setData((current) => ({ ...current, projects: [{ id: "personal", key: "PERSONAL", name: "Продукты" }],
    testCases: Array.from({ length: 43 }, (_, index): TestCaseSummary => ({ id: `old-${index}`, key: `PERSONAL-${index}`, projectId: "personal",
      folderPath: "/Old", title: "Old case", component: "", tags: [], archivedAt: null, currentRevision: 1, revisionCount: 1,
      type: "manual", lifecycle: "ready", priority: "medium", ownerIdentityId: null, estimatedMinutes: null,
      createdAt: "2026-09-09", updatedAt: "2026-09-09", etag: `"old-${index}:1"` })) }));
  const derive = compile<typeof import("../../workspace-derived/useWorkspaceDerived")>("../../workspace-derived/useWorkspaceDerived.ts").useWorkspaceDerived;
  const base = { ...bootstrap, get data() { return slots[0] as Bootstrap; }, connection: "connected", projectId: "personal", query: "", view: "portfolios",
    customFolders: {}, selectedCaseId: "", caseFilters: { includeArchived: false, type: "all", priority: "all", lifecycle: "all", tag: "" },
    isCaseSubmitting: () => false, setProjectId: (id: string) => { base.projectId = id; } };
  const state = new Proxy(base, { get(target, name) { return name in target ? Reflect.get(target, name) : () => undefined; } }) as unknown as Parameters<typeof derive>[0];
  const actions = compile<typeof import("../useWorkspaceActions")>("../useWorkspaceActions.ts").useWorkspaceActions(state);
  const model = { ...state, ...actions, setSelectedFolder: state.setSelectedFolder, setSelectedCaseId: state.setSelectedCaseId, setView: () => {
    const current = derive(state);
    screens.push({ project: current.project?.id, cases: current.projectCases.map((item) => item.id) });
  } };
  const stage = compile<typeof import("../../../presentation/workspace-stage/portfolios/WorkspacePortfoliosStage")>(
    "../../../presentation/workspace-stage/portfolios/WorkspacePortfoliosStage.tsx");
  const rendered = stage.WorkspacePortfoliosStage({ model: model as unknown as Parameters<typeof stage.WorkspacePortfoliosStage>[0]["model"] });
  const activate = rendered.props.onActivateProject as (id: string) => Promise<boolean>;
  const open = async (id: string) => {
    if (!await activate(id)) return;
    const current = derive(state);
    screens.push({ project: current.project?.id, cases: current.projectCases.map((item) => item.id) });
  };
  return { metadata, collections, screens, memory, open, data: () => slots[0] as Bootstrap, state, derive };
}

test("catalog navigation waits for a missing project's metadata and opens its own empty repository", async () => {
  const h = harness();
  const opening = h.open(pay.id);
  h.collections[0].resolve(emptyCollections);
  await setImmediate();
  assert.deepEqual(h.screens, []);
  assert.equal(h.state.projectId, "personal");
  h.metadata[0].resolve({ data: pay, etag: '"pay:1"' });
  await opening;
  assert.equal(h.data().projects.find((project) => project.id === pay.id)?.name, pay.name);
  assert.equal(h.memory.get("tms.project.v1"), pay.id);
  assert.deepEqual(h.screens, [{ project: pay.id, cases: [] }]);
  assert.equal(h.data().testCases.length, 43);
});

test("failed metadata leaves current selection and repository intact even if case loading succeeds", async () => {
  const h = harness();
  const opening = h.open(pay.id);
  h.collections[0].resolve(emptyCollections);
  h.metadata[0].reject(new Error("Project unavailable"));
  await opening;
  assert.equal(h.state.projectId, "personal");
  assert.deepEqual(h.screens, []);
  assert.equal(h.data().projects.length, 1);
});

test("a newer project selection wins over late metadata from a previous catalog click", async () => {
  const h = harness();
  const first = h.open(pay.id);
  const second = h.open("newer");
  assert.equal(h.metadata[0].signal.aborted, true);
  assert.equal(h.collections[0].signal.aborted, true);
  h.metadata[1].resolve({ data: { ...pay, id: "newer" }, etag: '"newer:1"' });
  h.collections[1].resolve(emptyCollections);
  await second;
  h.metadata[0].resolve({ data: pay, etag: '"pay:1"' });
  h.collections[0].resolve(emptyCollections);
  await first;
  assert.deepEqual(h.screens, [{ project: "newer", cases: [] }]);
  assert.equal(h.data().projects.some((project) => project.id === pay.id), false);
});

test("an unresolved project ID cannot display another project's header or case collection", () => {
  const h = harness();
  h.state.setProjectId("not-loaded");
  const derived = h.derive(h.state);
  assert.equal(derived.project, undefined);
  assert.deepEqual(derived.projectCases, []);
});
