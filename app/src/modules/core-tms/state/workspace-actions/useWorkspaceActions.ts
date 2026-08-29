import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

export function useWorkspaceActions(
  state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>,
) {
  const notify = (message: string) => state.setNotice(message);

  async function chooseProject(nextProjectId: string) {
    const remote = state.connection === "demo"
      ? null
      : await state.loadProject(nextProjectId);
    if (state.connection !== "demo" && !remote) return;
    window.localStorage.setItem("tms.project.v1", nextProjectId);
    state.setProjectId(nextProjectId);
    const testCases = remote?.testCases ?? state.data.testCases;
    const runs = remote?.runs ?? state.data.runs;
    const suites = remote?.suites ?? state.data.suites;
    const nextCase = testCases.find(
      (item) => item.projectId === nextProjectId,
    );
    state.setSelectedCaseId(nextCase?.id ?? "");
    state.setSelectedFolder(nextCase?.folderPath ?? "/Unsorted");
    state.setSelectedSuiteId(
      suites.find((item) => item.projectId === nextProjectId)?.id ??
        "",
    );
    state.setSelectedRunId(
      runs.find((item) => item.projectId === nextProjectId && !item.archivedAt)?.id ??
        null,
    );
    state.setSelectedRunItemId(null);
    state.setSelectedCaseDetail(null);
    state.setRunItems([]);
    state.setQuery("");
    state.setCaseFilters({
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
    const firstCase = derived.visibleCases.find(
      (item) => item.folderPath === folderPath,
    );
    state.setSelectedCaseId(firstCase?.id ?? "");
  }

  return { notify, chooseProject, selectFolder };
}
