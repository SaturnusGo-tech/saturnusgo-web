"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { connectorApi } from "../../data/connector-api";
import type { Connection, Provider, Scope } from "../../model/connector-types";
type Resource = { workspaceId: string; projectId: string | null; connections: Connection[]; state: "loading" | "ready" | "error" };
export function useConnectorCatalog(workspaceId: string, enabled: boolean, swaggerProjectId: string | null = null) {
  const http = useTmsHttpClient();
  const [revision, setRevision] = useState(0);
  const [resource, setResource] = useState<Resource>({ workspaceId: "", projectId: null, connections: [], state: "loading" });
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(() => { request.current?.abort(); setRevision((value) => value + 1); }, []);
  useEffect(() => {
    if (!enabled || !workspaceId) return;
    const controller = new AbortController(); request.current = controller;
    setResource((current) => current.workspaceId === workspaceId && current.projectId === swaggerProjectId && current.state === "ready" ? current :
      { workspaceId, projectId: swaggerProjectId, connections: [], state: "loading" });
    const api = connectorApi(http);
    const load = swaggerProjectId === null ? api.list(workspaceId, controller.signal) :
      api.configuration({ workspaceId, projectId: swaggerProjectId }, "swagger", controller.signal)
        .then((result) => result.data ? [result.data] : []);
    void load.then((data) => {
      if (!controller.signal.aborted) setResource({ workspaceId, projectId: swaggerProjectId, connections: data, state: "ready" });
    }).catch(() => {
      if (!controller.signal.aborted) setResource({ workspaceId, projectId: swaggerProjectId, connections: [], state: "error" });
    });
    return () => controller.abort();
  }, [http, workspaceId, revision, enabled, swaggerProjectId]);
  const update = useCallback((scope: Scope, provider: Provider, connection: Connection | null) => {
    if (scope.workspaceId !== workspaceId || (swaggerProjectId !== null &&
      (scope.projectId !== swaggerProjectId || provider !== "swagger"))) return;
    request.current?.abort();
    setResource((current) => ({ workspaceId, projectId: swaggerProjectId, state: "ready", connections: [
      ...(current.workspaceId === workspaceId ? current.connections : []).filter((item) =>
        item.projectId !== scope.projectId || item.provider !== provider), ...(connection ? [connection] : []),
    ] }));
    setRevision((value) => value + 1);
  }, [workspaceId, swaggerProjectId]);
  const visible = enabled && resource.workspaceId === workspaceId && resource.projectId === swaggerProjectId ? resource :
    { workspaceId, projectId: swaggerProjectId, connections: [], state: "loading" as const };
  return { ...visible, refresh, update };
}
