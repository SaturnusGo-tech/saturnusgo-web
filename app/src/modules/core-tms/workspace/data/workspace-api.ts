import type { components } from "../../../../core/tms/generated/tms-api";
import type { Bootstrap, Project } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { listDefects } from "../../defects/data/defect-api";
import { listEnvironments } from "../../environments/data/environment-api";
import { listExternalLinks } from "../../external-links/data/external-link-api";
import { listRuns } from "../../runs/data/run-api";
import { listSuites } from "../../suites/data/suite-api";
import { listTestCases } from "../../test-cases/data/test-case-api";

type Api = components["schemas"];

function mapProject(project: Api["ProjectSummary"]): Project {
  return {
    id: project.id,
    key: project.key,
    name: project.name,
    status: project.status,
  };
}

export async function loadProjectCollections(
  http: TmsHttpClient,
  projectId: string,
  signal?: AbortSignal,
) {
  const [cases, runs, environments, suites, defects, links] = await Promise.all([
    listTestCases(http, projectId, signal),
    listRuns(http, projectId, signal),
    listEnvironments(http, projectId, signal),
    listSuites(http, projectId, signal),
    listDefects(http, projectId, signal),
    listExternalLinks(http, projectId, signal),
  ]);
  return {
    testCases: cases.items,
    runs: runs.items,
    environments: environments.items,
    suites: suites.items,
    defects: defects.items,
    externalLinks: links.items,
  };
}

export async function loadWorkspace(
  http: TmsHttpClient,
  preferredProjectId?: string,
  signal?: AbortSignal,
  workspaceId?: string,
): Promise<Bootstrap> {
  const parameters = new URLSearchParams({ recentLimit: "20" });
  if (workspaceId) parameters.set("workspaceId", workspaceId);
  if (preferredProjectId) parameters.set("projectId", preferredProjectId);
  const envelope = await http.get<Api["WorkspaceBootstrapEnvelope"]>(
    `/bootstrap?${parameters.toString()}`, signal,
  );
  const summary = envelope.data;
  const projects = summary.projects.map(mapProject);
  const project = projects.find((item) => item.id === preferredProjectId && item.status !== "archived")
    ?? projects.find((item) => item.status !== "archived");
  const collections = project
    ? await loadProjectCollections(http, project.id, signal)
    : { testCases: [], runs: [], environments: [], suites: [], defects: [], externalLinks: [] };
  return {
    workspace: {
      id: summary.workspace.id,
      key: summary.workspace.key,
      slug: summary.workspace.slug,
      name: summary.workspace.name,
    },
    projects,
    ...collections,
    dashboards: [],
    activity: summary.recentActivity.map((entry) => ({
      id: entry.id,
      actor: entry.actor,
      action: entry.action,
      entityKey: entry.entityKey,
      createdAt: entry.createdAt,
    })),
    meta: {
      generatedAt: summary.meta.generatedAt,
      apiVersion: envelope.meta.compositionVersion,
      authorization: {
        role: envelope.meta.authorization.role,
        capabilities: [...envelope.meta.authorization.capabilities],
      },
    },
  };
}
