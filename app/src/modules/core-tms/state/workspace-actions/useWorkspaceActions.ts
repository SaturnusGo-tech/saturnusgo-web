import type { useWorkspaceState } from "../workspace/useWorkspaceState";
import { defaultWorkingRun } from "../../runs/model/history/run-history";

export function useWorkspaceActions(
  state: ReturnType<typeof useWorkspaceState>,
) {
  const notify = (message: string) => state.setNotice(message);

  async function chooseProject(nextProjectId: string): Promise<boolean> {
    if (state.isCaseSubmitting()) return false;
    const remote = state.connection === "demo"
      ? null
      : await state.loadProject(nextProjectId);
    if (state.isCaseSubmitting()) return false;
    if (state.connection !== "demo" && !remote) return false;
    window.localStorage.setItem("tms.project.v1", nextProjectId);
    state.setProjectId(nextProjectId);
    const testCases = remote?.testCases ?? state.data.testCases;
    const runs = remote?.runs ?? state.data.runs;
    const suites = remote?.suites ?? state.data.suites;
    const nextCase = testCases.find(
      (item) => item.projectId === nextProjectId,
    );
    state.resetCaseEditor(nextCase?.folderPath ?? "/Unsorted");
    state.setSelectedCaseId("");
    state.setSelectedFolder("");
    state.setSelectedFolderId("");
    state.setSelectedSuiteId(
      suites.find((item) => item.projectId === nextProjectId)?.id ??
        "",
    );
    state.setSelectedRunId(
      defaultWorkingRun(runs, nextProjectId)?.id ?? null,
    );
    state.setSelectedRunItemId(null);
    state.setSelectedCaseDetail(null);
    state.setRunItems([]);
    state.setQuery("");
    state.setCaseFilters({
      type: "all",
      priority: "all",
      lifecycle: "all",
      tag: "",
      includeArchived: false,
    });
    return true;
  }

  function selectFolder(folderPath: string) {
    state.setSelectedFolder(folderPath);
    state.setCollapsedFolders((current) =>
      current.filter((item) => item !== folderPath),
    );
    state.setSelectedCaseId("");
  }

  return { notify, chooseProject, selectFolder };
}
