import { useCallback, useEffect, useRef, useState } from "react";
import type { Bootstrap } from "../../../../core/tms/contracts/legacy-contract";
import {
  createWorkspaceShell,
  fallbackBootstrap,
} from "../../../../core/tms/fallback/bootstrap";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { readCaseDeepLink } from "../../test-cases/navigation/case-deep-link";
import { loadProjectCollections, loadWorkspace } from "../../workspace/data/workspace-api";

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
  const activeRequest = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  useEffect(() => {
    const requestId = ++activeRequest.current;
    const controller = new AbortController();
    activeController.current?.abort();
    activeController.current = controller;
    setConnection("loading");
    setFailure(null);
    const linkedProjectId = readCaseDeepLink(window.location.href).projectId;
    const linkedWorkspaceId = new URL(window.location.href).searchParams.get("workspaceId")?.trim()
      || undefined;
    const preferredProjectId = linkedProjectId
      ?? window.localStorage.getItem("tms.project.v1")
      ?? undefined;
    loadWorkspace(http, preferredProjectId, controller.signal, linkedWorkspaceId)
      .then((payload) => {
        if (controller.signal.aborted || requestId !== activeRequest.current) return;
        setData(payload);
        setConnection("connected");
        setGeneration((current) => current + 1);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestId !== activeRequest.current) return;
        const apiError = error instanceof TmsApiError ? error : null;
        setFailure({
          detail: apiError
            ? `status ${apiError.status}`
            : "unreachable",
          requestId: apiError?.requestId ?? null,
        });
        setConnection("error");
      });
    return () => controller.abort();
  }, [http, requestVersion]);

  const retryBootstrap = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    const requestId = ++activeRequest.current;
    const controller = new AbortController();
    activeController.current?.abort();
    activeController.current = controller;
    try {
      const collections = await loadProjectCollections(http, projectId, controller.signal);
      if (controller.signal.aborted || requestId !== activeRequest.current) return null;
      setData((current) => ({
        ...current,
        testCases: [
          ...current.testCases.filter((item) => item.projectId !== projectId),
          ...collections.testCases,
        ],
        runs: [
          ...current.runs.filter((item) => item.projectId !== projectId),
          ...collections.runs,
        ],
        environments: [
          ...current.environments.filter((item) => item.projectId !== projectId),
          ...collections.environments,
        ],
        suites: [
          ...current.suites.filter((item) => item.projectId !== projectId),
          ...collections.suites,
        ],
        defects: [
          ...current.defects.filter((item) => item.projectId !== projectId),
          ...collections.defects,
        ],
        externalLinks: [
          ...current.externalLinks.filter((item) => item.projectId !== projectId),
          ...collections.externalLinks,
        ],
      }));
      return collections;
    } catch (error) {
      if (controller.signal.aborted || requestId !== activeRequest.current) return null;
      const apiError = error instanceof TmsApiError ? error : null;
      setFailure({ detail: apiError ? `status ${apiError.status}` : "unreachable", requestId: apiError?.requestId ?? null });
      return null;
    }
  }, [http]);

  const useDevelopmentDemo = useCallback(() => {
    if (!DEMO_AVAILABLE) return;
    activeController.current?.abort();
    activeRequest.current += 1;
    setData(readDemoCache());
    setFailure(null);
    setConnection("demo");
    setGeneration((current) => current + 1);
  }, []);

  return {
    data,
    setData,
    connection,
    failure,
    generation,
    loadProject,
    retryBootstrap,
    useDevelopmentDemo,
    demoAvailable: DEMO_AVAILABLE,
  };
}
