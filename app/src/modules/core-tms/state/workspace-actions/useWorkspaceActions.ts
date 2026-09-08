import type { useWorkspaceState } from "../workspace/useWorkspaceState";

export function useWorkspaceActions(
  state: ReturnType<typeof useWorkspaceState>,
) {
  const notify = (message: string) => state.setNotice(message);

  async function chooseProject(nextProjectId: string) {
    if (state.isCaseSubmitting()) return;
    const remote = state.connection === "demo"
      ? null
      : await state.loadProject(nextProjectId);
    if (state.isCaseSubmitting()) return;
    if (state.connection !== "demo" && !remote) return;
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
    state.setSelectedFolder(nextCase?.folderPath ?? "/Unsorted");
    state.setSelectedSuiteId(
      suites.find((item) => item.projectId === nextProjectId)?.id ??
        "",
    );
    state.setSelectedRunId(
      runs.find((item) => item.projectId === nextProjectId && item.status === "active" && !item.archivedAt)?.id ??
        runs.find((item) => item.projectId === nextProjectId && !item.archivedAt)?.id ??
        null,
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
