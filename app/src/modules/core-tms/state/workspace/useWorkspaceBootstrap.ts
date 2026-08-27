import { useCallback, useEffect, useRef, useState } from "react";
import type { Bootstrap } from "../../../../core/tms/contracts/legacy-contract";
import {
  createWorkspaceShell,
  fallbackBootstrap,
} from "../../../../core/tms/fallback/bootstrap";
import {
  fetchBootstrap,
  TmsApiError,
} from "../../../../core/tms/transport/http";

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
    return JSON.parse(cached) as Bootstrap;
  } catch {
    window.localStorage.removeItem(DEMO_CACHE_KEY);
    return fallbackBootstrap();
  }
}

export function useWorkspaceBootstrap() {
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
    fetchBootstrap(controller.signal)
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
            ? `The TMS API returned status ${apiError.status}.`
            : "The TMS API could not be reached.",
          requestId: apiError?.requestId ?? null,
        });
        setConnection("error");
      });
    return () => controller.abort();
  }, [requestVersion]);

  const retryBootstrap = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

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
    retryBootstrap,
    useDevelopmentDemo,
    demoAvailable: DEMO_AVAILABLE,
  };
}
