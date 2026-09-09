import type { Bootstrap, Project } from "../../../../../core/tms/contracts/legacy-contract";
import type { loadProjectCollections } from "../../../workspace/data/workspace-api";

export type ProjectCollections = Awaited<ReturnType<typeof loadProjectCollections>>;

export function mergeProjectCollections(current: Bootstrap, projectId: string, collections: ProjectCollections, project?: Project): Bootstrap {
  return {
    ...current,
    projects: project ? current.projects.some((item) => item.id === project.id)
      ? current.projects.map((item) => item.id === project.id ? project : item)
      : [...current.projects, project] : current.projects,
    testCases: [...current.testCases.filter((item) => item.projectId !== projectId), ...collections.testCases],
    runs: [...current.runs.filter((item) => item.projectId !== projectId), ...collections.runs],
    environments: [...current.environments.filter((item) => item.projectId !== projectId), ...collections.environments],
    suites: [...current.suites.filter((item) => item.projectId !== projectId), ...collections.suites],
    defects: [...current.defects.filter((item) => item.projectId !== projectId), ...collections.defects],
    externalLinks: [...current.externalLinks.filter((item) => item.projectId !== projectId), ...collections.externalLinks],
  };
}
