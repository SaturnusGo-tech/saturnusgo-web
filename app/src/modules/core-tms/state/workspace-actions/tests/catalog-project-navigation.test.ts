import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { createWorkspaceShell } from "../../../../../core/tms/fallback/bootstrap";
import { defaultWorkingRun } from "../../../runs/model/history/run-history";

function compile(path: URL, overrides: Record<string, unknown> = {}) {
  const module = { exports: {} as Record<string, (input: unknown) => unknown> };
  runInNewContext(ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, ...overrides });
  return module.exports;
}
function harness(loaded: boolean, submitting = false) {
  const events: string[] = [];
  const data = createWorkspaceShell();
  const actions = compile(new URL("../useWorkspaceActions.ts", import.meta.url), {
    require: () => ({ defaultWorkingRun }),
    window: { localStorage: { setItem: () => events.push("remember") } },
  });
  const state = new Proxy({ connection: "connected", data, isCaseSubmitting: () => submitting,
    loadProject: async () => loaded ? { testCases: [], runs: [], suites: [] } : null }, {
    get(target, name) { return name in target ? target[name as keyof typeof target] : () => events.push(String(name)); },
  });
  const result = actions.useWorkspaceActions(state) as { chooseProject: (id: string) => Promise<boolean> };
  const stage = compile(new URL("../../../presentation/workspace-stage/portfolios/WorkspacePortfoliosStage.tsx", import.meta.url), {
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx: (type: unknown, props: unknown) => ({ type, props }) };
      if (name.endsWith("usePortfolioRoute")) return { usePortfolioRoute: () => ({ route: { kind: "catalog" }, navigate: () => {} }) };
      return { PortfoliosView: "PortfoliosView" };
    },
  });
  const model = { data, ...result, setSelectedFolder: () => events.push("folder"), setSelectedCaseId: () => events.push("case"),
    setView: () => events.push("show-cases"), connection: "connected" };
  const component = stage.WorkspacePortfoliosStage({ model }) as { props: { onActivateProject: (projectId: string) => Promise<boolean> } };
  return { events, choose: result.chooseProject, open: component.props.onActivateProject };
}

test("failed catalog project load leaves the previous view and selections intact", async () => {
  const h = harness(false);
  assert.equal(await h.choose("project-b"), false);
  await h.open("project-b");
  assert.deepEqual(h.events, []);
});

test("case submission prevents catalog navigation without clearing the editor", async () => {
  const h = harness(true, true);
  assert.equal(await h.choose("project-b"), false);
  await h.open("project-b");
  assert.deepEqual(h.events, []);
});

test("successful catalog project activation commits its scope without leaving the project page", async () => {
  const h = harness(true);
  await h.open("project-b");
  assert.ok(h.events.indexOf("setProjectId") >= 0);
  assert.equal(h.events.includes("show-cases"), false);
});
