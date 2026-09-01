import { useMemo } from "react";
import type { TestCaseSummary, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

export const isAuthoritativelyActiveRun = (
  run: Pick<TestRunSummary, "status" | "archivedAt">,
) => run.status === "active" && !run.archivedAt;

export function useWorkspaceDerived(
  state: ReturnType<typeof useWorkspaceState>,
) {
  const projects = state.data.projects;
  const project =
    projects.find((item) => item.id === state.projectId) ?? projects[0];
  const projectCases = state.data.testCases.filter(
    (item) => item.projectId === project?.id,
  );
  const visibleCases = projectCases.filter((item) => {
    const text = `${item.key} ${item.folderPath} ${item.title} ${item.tags.join(" ")}`.toLowerCase();
    const filters = state.caseFilters;
    return (
      text.includes(state.query.toLowerCase()) &&
      (filters.includeArchived || !item.archivedAt) &&
      (filters.type === "all" || item.type === filters.type) &&
      (filters.priority === "all" || item.priority === filters.priority) &&
      (filters.lifecycle === "all" ||
        item.lifecycle === filters.lifecycle) &&
      (!filters.tag.trim() ||
        item.tags.some((tagName) =>
          tagName.toLowerCase().includes(filters.tag.trim().toLowerCase()),
        ))
    );
  });
  const selectedCase =
    state.data.testCases.find((item) => item.id === state.selectedCaseId) ??
    visibleCases[0];
  const selectedRevision = state.selectedCaseDetail && selectedCase &&
    state.selectedCaseDetail.id === selectedCase.id
    ? state.selectedCaseDetail.current
    : null;
  const projectSuites = state.data.suites.filter(
    (item) => item.projectId === project?.id,
  );
  const selectedSuite = state.selectedSuiteDetail?.id === state.selectedSuiteId
    ? state.selectedSuiteDetail
    : null;
  const projectEnvironments = state.data.environments.filter(
    (item) => item.projectId === project?.id,
  );
  const projectRuns = state.data.runs.filter(
    (item) => item.projectId === project?.id,
  );
  const activeProjectRuns = projectRuns.filter(isAuthoritativelyActiveRun);
  const selectedRun =
    state.data.runs.find((item) => item.id === state.selectedRunId) ??
    activeProjectRuns[0] ??
    projectRuns.find((item) => !item.archivedAt) ??
    null;
  const selectedRunItem = state.selectedRunItemDetail?.id === state.selectedRunItemId
    ? state.selectedRunItemDetail
    : null;
  const projectDefects = state.data.defects.filter(
    (item) => item.projectId === project?.id,
  );
  const projectLinks = state.data.externalLinks.filter(
    (item) => item.projectId === project?.id && item.status === "active",
  );
  const folderGroups = useMemo(() => {
    const groups = new Map<string, TestCaseSummary[]>();
    const knownFolders = new Set<string>([
      ...projectCases.map((item) => item.folderPath),
      ...(project ? state.customFolders[project.id] ?? [] : []),
    ]);
    knownFolders.forEach((folderName) => groups.set(folderName, []));
    visibleCases.forEach((item) => {
      const items = groups.get(item.folderPath) ?? [];
      items.push(item);
      groups.set(item.folderPath, items);
    });
    return Array.from(groups.entries()).sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [project, projectCases, state.customFolders, visibleCases]);
  const executionProgress = selectedRun?.progress.percent ?? 0;

  return {
    projects, project, projectCases, visibleCases, selectedCase,
    selectedRevision, projectSuites, selectedSuite, projectEnvironments, projectRuns,
    activeProjectRuns,
    selectedRun, selectedRunItem, projectDefects, projectLinks, folderGroups,
    executionProgress,
  };
}
