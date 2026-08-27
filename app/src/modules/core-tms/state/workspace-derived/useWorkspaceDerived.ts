import { useMemo } from "react";
import type { TestCase } from "../../../../core/tms/contracts/legacy-contract";
import { latestRevision } from "../../helpers/cases/caseRevision";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

export function useWorkspaceDerived(
  state: ReturnType<typeof useWorkspaceState>,
) {
  const projects = state.data.projects.filter(
    (item) => item.status !== "archived",
  );
  const project =
    projects.find((item) => item.id === state.projectId) ?? projects[0];
  const projectCases = state.data.testCases.filter(
    (item) => item.projectId === project?.id,
  );
  const visibleCases = projectCases.filter((item) => {
    const value = latestRevision(item);
    const text = `${item.key} ${item.folderPath} ${value.title} ${value.tags.join(" ")}`.toLowerCase();
    const filters = state.caseFilters;
    return (
      text.includes(state.query.toLowerCase()) &&
      (filters.includeArchived || !item.archivedAt) &&
      (filters.priority === "all" || value.priority === filters.priority) &&
      (filters.lifecycle === "all" ||
        value.lifecycle === filters.lifecycle) &&
      (!filters.tag.trim() ||
        value.tags.some((tagName) =>
          tagName.toLowerCase().includes(filters.tag.trim().toLowerCase()),
        ))
    );
  });
  const selectedCase =
    state.data.testCases.find((item) => item.id === state.selectedCaseId) ??
    visibleCases[0];
  const selectedRevision = selectedCase
    ? latestRevision(selectedCase)
    : null;
  const projectSuites = state.data.suites.filter(
    (item) => item.projectId === project?.id,
  );
  const projectEnvironments = state.data.environments.filter(
    (item) =>
      item.projectId === project?.id && item.status !== "archived",
  );
  const projectRuns = state.data.runs.filter(
    (item) => item.projectId === project?.id,
  );
  const selectedRun =
    state.data.runs.find((item) => item.id === state.selectedRunId) ??
    projectRuns[0] ??
    null;
  const selectedRunItem =
    selectedRun?.items.find(
      (item) => item.id === state.selectedRunItemId,
    ) ??
    selectedRun?.items[0] ??
    null;
  const projectDefects = state.data.defects.filter(
    (item) => item.projectId === project?.id,
  );
  const folderGroups = useMemo(() => {
    const groups = new Map<string, TestCase[]>();
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
  const executionProgress = selectedRun
    ? Math.round(
        (selectedRun.items.filter((item) =>
          ["passed", "failed", "blocked", "skipped"].includes(item.status),
        ).length /
          Math.max(selectedRun.items.length, 1)) *
          100,
      )
    : 0;

  return {
    projects, project, projectCases, visibleCases, selectedCase,
    selectedRevision, projectSuites, projectEnvironments, projectRuns,
    selectedRun, selectedRunItem, projectDefects, folderGroups,
    executionProgress,
  };
}
