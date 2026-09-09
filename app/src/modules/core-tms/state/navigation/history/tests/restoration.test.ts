import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { WorkspaceNavigationRestoration } from "../../restoration/workspace-navigation-restoration";
import { readWorkspaceDeepLink, buildWorkspaceDeepLink } from "../../workspace-deep-link";
import { isProjectCaseContext } from "../../../../test-cases/navigation/project/project-case-context";
import { readCaseDeepLink } from "../../../../test-cases/navigation/case-deep-link";
import { buildDefectDeepLink } from "../../../../defects/navigation/defect-deep-link";
import type { useWorkspaceHistory } from "../../browser/useWorkspaceHistory";
function harness() {
  let href = "https://tms.example/work/?workspaceId=w&projectId=p&view=suites&suiteId=suite-1";
  const listeners = new Map<string, () => void>(); const writes: Array<{ href: string; replace: boolean }> = [];
  const events: string[] = []; const effects: Array<() => void> = [];
  const module = { exports: {} as { useWorkspaceHistory: typeof useWorkspaceHistory } };
  const compiled = ts.transpileModule(readFileSync(new URL("../../browser/useWorkspaceHistory.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText;
  runInNewContext(compiled, { module, exports: module.exports, URL,
    window: { location: { get href() { return href; } }, addEventListener: (event: string, callback: () => void) => listeners.set(event, callback), removeEventListener: () => {} },
    require(name: string) {
      if (name === "react") return { useRef: (current: unknown) => ({ current }), useCallback: (callback: unknown) => callback, useEffect: (callback: () => void) => effects.push(callback) };
      if (name.endsWith("workspace-deep-link")) return { readWorkspaceDeepLink };
      if (name.endsWith("project-case-context")) return { isProjectCaseContext };
      if (name.endsWith("case-deep-link")) return { readCaseDeepLink };
      if (name.endsWith("workspace-navigation-restoration")) return { WorkspaceNavigationRestoration };
      if (name === "./workspace-history") return { initializeWorkspaceHistory: () => {}, navigateWorkspace: (next: string, replace: boolean) => { href = next; writes.push({ href, replace }); } };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const history = module.exports.useWorkspaceHistory({ workspaceId: "w", projectId: "p", view: "suites", runId: null, caseId: "", ready: true,
    setView: view => events.push(`view:${view}`), setRun: run => events.push(`run:${run}`), setItem: item => events.push(`item:${item}`), setCase: id => events.push(`case:${id}`),
    closeDialog: () => events.push("close"), reload: () => events.push("reload") });
  effects.forEach(effect => effect());
  return { history, writes, events, pop: (next: string) => { href = next; listeners.get("popstate")!(); }, href: () => href };
}
test("sidebar navigation after an intra-suite Back pushes a new entry instead of replacing the source", () => {
  const h = harness(); h.history.write(h.href());
  h.pop("https://tms.example/work/?workspaceId=w&projectId=p&view=suites");
  // Same root selection: React does not necessarily rerun the URL effect for this popstate.
  h.history.navigateView("dashboard");
  h.history.write("https://tms.example/work/?workspaceId=w&projectId=p&view=dashboard");
  assert.equal(h.writes[h.writes.length - 1]?.replace, false);
});
test("Back into another project reloads through the workspace boundary without applying stale entity setters", () => {
  const h = harness(); h.pop("https://tms.example/work/?workspaceId=w&projectId=other&view=runs&runId=r&runItemId=i");
  assert.deepEqual(h.events, ["close", "reload"]); assert.equal(h.history.canWrite(), false);
});
test("same-project history restores case and run occurrence selections", () => {
  const h = harness(); h.pop("https://tms.example/work/?workspaceId=w&projectId=p&caseId=c");
  assert.deepEqual(h.events, ["close", "view:cases", "case:c", "run:null", "item:null"]);
  h.events.length = 0; h.pop("https://tms.example/work/?workspaceId=w&projectId=p&view=runs&runId=r&runItemId=i");
  assert.deepEqual(h.events, ["close", "view:runs", "case:", "run:r", "item:i"]);
});
test("defect navigation is already canonical, without widget, suite or article parameters that create a second entry", () => {
  const href = buildDefectDeepLink("https://tms.example/work/?workspaceId=w&projectId=p&view=dashboard&dashboardDetail=filter&suiteId=s&article=help&integration=slack#title", { projectId: "p", defectId: "bug-1" });
  assert.equal(href, buildWorkspaceDeepLink(href, { workspaceId: "w", projectId: "p", view: "reports", runId: null }));
  assert.equal(new URL(href).searchParams.get("dashboardDetail"), null);
});
