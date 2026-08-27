import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

export function useWorkspaceActions(
  state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>,
) {
  const notify = (message: string) => state.setNotice(message);

  function chooseProject(nextProjectId: string) {
    window.localStorage.setItem("tms.project.v1", nextProjectId);
    state.setProjectId(nextProjectId);
    const nextCase = state.data.testCases.find(
      (item) => item.projectId === nextProjectId,
    );
    state.setSelectedCaseId(nextCase?.id ?? "");
    state.setSelectedFolder(nextCase?.folderPath ?? "/Unsorted");
    state.setSelectedSuiteId(
      state.data.suites.find((item) => item.projectId === nextProjectId)?.id ??
        "",
    );
    state.setSelectedRunId(
      state.data.runs.find((item) => item.projectId === nextProjectId)?.id ??
        null,
    );
    state.setSelectedRunItemId(null);
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
