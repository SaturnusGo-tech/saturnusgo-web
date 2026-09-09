import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { buildDefectDeepLink } from "../../../defects/navigation/defect-deep-link";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "../../navigation/workspace-deep-link";
import { openRunNavigation } from "../open-run-navigation";

type Row = { entity: "run" | "run_item" | "defect"; projectId: string; id: string; runId?: string; runItemId?: string };
function harness() {
  let href = "https://tms.example/work/?workspaceId=w&projectId=p&view=dashboard&caseId=old&integration=slack";
  const events: string[] = [];
  const selection = { runId: "old", runItemId: null as string | null, view: "dashboard" };
  const setRun = (id: string) => { selection.runId = id; events.push("run"); };
  const setItem = (id: string | null) => { selection.runItemId = id; events.push("item"); };
  const setView = (view: string) => { selection.view = view; events.push("view"); };
  const model = {
    connection: "connected", project: { id: "p" }, data: { workspace: { id: "w" } }, view: "dashboard",
    chooseProject: async () => { events.push("choose-project"); },
    setSelectedRunId: setRun, setSelectedRunItemId: setItem, setView,
    openRun(runId: string, runItemId: string | null) {
      openRunNavigation({ workspaceId: "w", projectId: "p", runId, runItemId }, {
        href, replace(next) { href = next; events.push("url"); }, clearDefect() { events.push("clear-defect"); },
        selectRun: setRun, selectItem: setItem, showRuns: () => setView("runs"),
      });
    },
  };
  const module = { exports: {} as { WorkspaceStage: (props: { model: typeof model }) => { props: { onOpenRow: (row: Row) => Promise<void> } } } };
  const jsx = (type: string, props: unknown) => ({ type, props });
  const compiled = ts.transpileModule(readFileSync(new URL("../../../presentation/workspace-stage/WorkspaceStage.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(compiled, { module, exports: module.exports,
    window: { location: { get href() { return href; }, assign(next: string) { href = next; events.push("assign"); } } },
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
      if (name.endsWith("workspace-history")) return { visitWorkspace: (next: string) => { href = next; events.push("navigate"); } };
      if (name.endsWith("workspace-deep-link")) return { buildWorkspaceDeepLink };
      if (name.endsWith("defect-deep-link")) return { buildDefectDeepLink };
      return new Proxy({}, { get: (_target, key) => key });
    },
  });
  return { click: module.exports.WorkspaceStage({ model }).props.onOpenRow, events, selection, href: () => href };
}

test("dashboard item click persists exact run URL before state changes or passive effects", async () => {
  const h = harness();
  await h.click({ entity: "run_item", projectId: "p", id: "item-target", runId: "run-target", runItemId: "item-target" });
  assert.deepEqual(h.events, ["url", "clear-defect", "run", "item", "view"]);
  assert.deepEqual(h.selection, { runId: "run-target", runItemId: "item-target", view: "runs" });
  assert.deepEqual(Object.fromEntries(new URL(h.href()).searchParams), {
    workspaceId: "w", projectId: "p", view: "runs", runId: "run-target", runItemId: "item-target",
  });
  assert.deepEqual(readWorkspaceDeepLink(h.href()), { view: "runs", runId: "run-target", runItemId: "item-target" });
});

test("dashboard run click uses the run identity and clears prior item selection", async () => {
  const h = harness();
  await h.click({ entity: "run", projectId: "p", id: "run-only" });
  assert.equal(h.events[0], "url");
  assert.deepEqual(h.selection, { runId: "run-only", runItemId: null, view: "runs" });
  assert.deepEqual(readWorkspaceDeepLink(h.href()), { view: "runs", runId: "run-only" });
});

test("workspace-wide run item navigates to its exact project without a stale project closure", async () => {
  const h = harness();
  await h.click({ entity: "run_item", projectId: "other-project", id: "other-item", runId: "other-run", runItemId: "other-item" });
  assert.deepEqual(h.events, ["navigate"]);
  assert.deepEqual(h.selection, { runId: "old", runItemId: null, view: "dashboard" });
  assert.deepEqual(Object.fromEntries(new URL(h.href()).searchParams), {
    workspaceId: "w", projectId: "other-project", view: "runs", runId: "other-run", runItemId: "other-item",
  });
  assert.deepEqual(readWorkspaceDeepLink(h.href()), { view: "runs", runId: "other-run", runItemId: "other-item" });
});

test("cross-project defect navigation retains its existing scoped report link", async () => {
  const h = harness();
  await h.click({ entity: "defect", projectId: "other-project", id: "defect-target" });
  assert.deepEqual(h.events, ["navigate"]);
  const query = new URL(h.href()).searchParams;
  assert.equal(query.get("workspaceId"), "w");
  assert.equal(query.get("projectId"), "other-project");
  assert.equal(query.get("view"), "reports");
  assert.equal(query.get("defectId"), "defect-target");
});
