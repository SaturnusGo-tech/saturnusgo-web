import { useCallback, useEffect, useRef, useState } from "react";
import type { Bootstrap } from "../../../../core/tms/contracts/legacy-contract";
import {
  createWorkspaceShell,
  fallbackBootstrap,
} from "../../../../core/tms/fallback/bootstrap";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { getProject } from "../../projects/data/project-api";
import { readCaseDeepLink } from "../../test-cases/navigation/case-deep-link";
import { loadProjectCollections, loadWorkspace } from "../../workspace/data/workspace-api";
import { mergeProjectCollections } from "./requests/project-collections";
import { createWorkspaceRequests } from "./requests/workspace-requests";

export type WorkspaceConnection =
  | "loading"
  | "connected"
  | "error"
  | "demo";

export type WorkspaceFailure = {
  detail: string;
  requestId: string | null;
};

const DEMO_CACHE_KEY = "tms.development-demo.v1";
const DEMO_AVAILABLE = process.env.NODE_ENV !== "production";

function readDemoCache(): Bootstrap {
  const cached = window.localStorage.getItem(DEMO_CACHE_KEY);
  if (!cached) return fallbackBootstrap();
  try {
    const fallback = fallbackBootstrap();
    const parsed = JSON.parse(cached) as Partial<Bootstrap>;
    return {
      ...fallback,
      ...parsed,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      environments: Array.isArray(parsed.environments) ? parsed.environments : [],
      testCases: Array.isArray(parsed.testCases) ? parsed.testCases : [],
      suites: Array.isArray(parsed.suites) ? parsed.suites : [],
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      defects: Array.isArray(parsed.defects) ? parsed.defects : [],
      externalLinks: Array.isArray(parsed.externalLinks) ? parsed.externalLinks : [],
      dashboards: Array.isArray(parsed.dashboards) ? parsed.dashboards : fallback.dashboards,
      activity: Array.isArray(parsed.activity) ? parsed.activity : [],
    };
  } catch {
    window.localStorage.removeItem(DEMO_CACHE_KEY);
    return fallbackBootstrap();
  }
}

export function useWorkspaceBootstrap() {
  const http = useTmsHttpClient();
  const [data, setData] = useState<Bootstrap>(() => createWorkspaceShell());
  const [connection, setConnection] = useState<WorkspaceConnection>("loading");
  const [failure, setFailure] = useState<WorkspaceFailure | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [generation, setGeneration] = useState(0);
  const requests = useRef(createWorkspaceRequests()).current;
  const workspaceId = useRef(data.workspace.id);
  workspaceId.current = data.workspace.id;

  useEffect(() => () => requests.cancel(), [requests]);

  useEffect(() => {
    const request = requests.beginNavigation();
    setConnection("loading");
    setFailure(null);
    const linkedProjectId = readCaseDeepLink(window.location.href).projectId;
    const linkedWorkspaceId = new URL(window.location.href).searchParams.get("workspaceId")?.trim()
      || undefined;
    const preferredProjectId = linkedProjectId
      ?? window.localStorage.getItem("tms.project.v1")
      ?? undefined;
    loadWorkspace(http, preferredProjectId, request.signal, linkedWorkspaceId)
      .then((payload) => {
        if (!request.isCurrent()) return;
        setData(payload);
        setConnection("connected");
        setGeneration((current) => current + 1);
      })
      .catch((error: unknown) => {
        if (!request.isCurrent()) return;
        const apiError = error instanceof TmsApiError ? error : null;
        setFailure({
          detail: apiError
            ? `status ${apiError.status}`
            : "unreachable",
          requestId: apiError?.requestId ?? null,
        });
        setConnection("error");
      }).finally(request.finish);
    return request.abort;
  }, [http, requestVersion, requests]);

  const retryBootstrap = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    const request = requests.beginNavigation();
    const scope = workspaceId.current;
    try {
      const [project, collections] = await Promise.all([
        getProject(http, projectId, request.signal),
        loadProjectCollections(http, projectId, request.signal),
      ]);
      if (!request.isCurrent() || workspaceId.current !== scope) return null;
      setData((current) => request.isCurrent() && current.workspace.id === scope
        ? mergeProjectCollections(current, projectId, collections, project.data) : current);
      return collections;
    } catch (error) {
      if (!request.isCurrent() || workspaceId.current !== scope) return null;
      const apiError = error instanceof TmsApiError ? error : null;
      setFailure({ detail: apiError ? `status ${apiError.status}` : "unreachable", requestId: apiError?.requestId ?? null });
      return null;
    } finally { request.finish(); }
  }, [http, requests]);

  const refreshProject = useCallback(async (projectId: string) => {
    const scope = workspaceId.current;
    const request = requests.beginRefresh(`${scope}:${projectId}`);
    if (!request) return null;
    try {
      const collections = await loadProjectCollections(http, projectId, request.signal);
      if (!request.isCurrent() || workspaceId.current !== scope) return null;
      setData((current) => request.isCurrent() && current.workspace.id === scope
        ? mergeProjectCollections(current, projectId, collections) : current);
      return collections;
    } catch {
      return null;
    } finally { request.finish(); }
  }, [http, requests]);

  const useDevelopmentDemo = useCallback(() => {
    if (!DEMO_AVAILABLE) return;
    requests.cancel();
    setData(readDemoCache());
    setFailure(null);
    setConnection("demo");
    setGeneration((current) => current + 1);
  }, [requests]);

  return {
    data,
    setData,
    connection,
    failure,
    generation,
    loadProject,
    refreshProject,
    captureProjectNavigationGuard: requests.captureNavigationGuard,
    retryBootstrap,
    useDevelopmentDemo,
    demoAvailable: DEMO_AVAILABLE,
  };
}
