import { hookHarness } from "../../../navigation/browser/tests/project/hook-harness";
import { createWorkspaceShell } from "../../../../../../core/tms/fallback/bootstrap";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import * as caseLinks from "../../../../test-cases/navigation/case-deep-link";
import * as workspaceLinks from "../../../navigation/workspace-deep-link";
import { isProjectCaseContext } from "../../../../test-cases/navigation/project/project-case-context";
import { resolveSelectedCase } from "../../../../test-cases/navigation/selection/selected-case";
import { WorkspaceNavigationRestoration } from "../../../navigation/restoration/workspace-navigation-restoration";
import type { useWorkspaceHistory } from "../../../navigation/browser/useWorkspaceHistory";
import type { useWorkspaceState } from "../../useWorkspaceState";

export const projectHref = "https://tms.example/work/?workspaceId=w&projectId=p&view=portfolios&catalogProjectId=p&projectTab=cases&folderId=transfers";
export function workspaceHarness(href = `${projectHref}&caseId=c`) {
  const h = hookHarness(href);
  const shell = createWorkspaceShell();
  const data = { ...shell, workspace: { ...shell.workspace, id: "w" },
    projects: [{ id: "p", key: "P", name: "Product", status: "active" }, { id: "other", key: "OTHER", name: "Other", status: "active" }],
    testCases: [
      { id: "c", projectId: "p", folderPath: "/Платежи/Переводы", folderId: "transfers", archivedAt: null },
      { id: "c2", projectId: "p", folderPath: "/Профиль", folderId: "profile", archivedAt: null },
      { id: "foreign", projectId: "other", folderPath: "/Other", folderId: "foreign-folder", archivedAt: null },
    ] as TestCaseSummary[], runs: [], suites: [] };
  const bootstrap = { data, generation: 1, connection: "connected", setData() {}, retryBootstrap() {} };
  function resolve(name: string): unknown {
    if (name.endsWith("project-case-context")) return { isProjectCaseContext };
    if (name.endsWith("case-deep-link")) return caseLinks;
    if (name.endsWith("workspace-deep-link")) return workspaceLinks;
    if (name.endsWith("workspace-navigation-restoration")) return { WorkspaceNavigationRestoration };
    if (name === "./workspace-history") return { initializeWorkspaceHistory() {}, navigateWorkspace: h.navigate };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("useWorkspaceBootstrap")) return { useWorkspaceBootstrap: () => bootstrap };
    if (name.endsWith("useWorkspaceHistory")) return { useWorkspaceHistory: historyHook };
    if (name.endsWith("useNavigationValue")) return { useNavigationValue: (_key: string, initial: unknown) => h.react.useState(initial) };
    if (name.endsWith("useCaseEditorState")) return { useCaseEditorState: () => ({}) };
    if (name.endsWith("useSelectedRunResource")) return { useSelectedRunResource: () => ({}) };
    if (name.endsWith("useSelectedSuiteResource")) return { useSelectedSuiteResource: () => ({}) };
    if (name.endsWith("useSelectedCaseResource")) return { useSelectedCaseResource: () => ({}) };
    if (name.endsWith("selected-case")) return { resolveSelectedCase };
    throw new Error(name);
  }
  const historyHook = h.load<{ useWorkspaceHistory: typeof useWorkspaceHistory }>(new URL("../../../navigation/browser/useWorkspaceHistory.ts", import.meta.url), resolve).useWorkspaceHistory;
  const stateHook = h.load<{ useWorkspaceState: typeof useWorkspaceState }>(new URL("../../useWorkspaceState.ts", import.meta.url), resolve).useWorkspaceState;
  return { h, bootstrap, render: () => h.settle(stateHook) };
}
