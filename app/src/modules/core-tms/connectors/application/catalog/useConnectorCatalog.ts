"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { connectorApi } from "../../data/connector-api";
import type { Connection, Provider, Scope } from "../../model/connector-types";
type Resource = { workspaceId: string; connections: Connection[]; state: "loading" | "ready" | "error" };
export function useConnectorCatalog(workspaceId: string, enabled: boolean) {
  const http = useTmsHttpClient();
  const [revision, setRevision] = useState(0);
  const [resource, setResource] = useState<Resource>({ workspaceId: "", connections: [], state: "loading" });
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(() => { request.current?.abort(); setRevision((value) => value + 1); }, []);
  useEffect(() => {
    if (!enabled || !workspaceId) return;
    const controller = new AbortController(); request.current = controller;
    setResource((current) => current.workspaceId === workspaceId && current.state === "ready" ? current :
      { workspaceId, connections: [], state: "loading" });
    void connectorApi(http).list(workspaceId, controller.signal).then((data) => {
      if (!controller.signal.aborted) setResource({ workspaceId, connections: data, state: "ready" });
    }).catch(() => {
      if (!controller.signal.aborted) setResource({ workspaceId, connections: [], state: "error" });
    });
    return () => controller.abort();
  }, [http, workspaceId, revision, enabled]);
  const update = useCallback((scope: Scope, provider: Provider, connection: Connection | null) => {
    if (scope.workspaceId !== workspaceId) return;
    request.current?.abort();
    setResource((current) => ({ workspaceId, state: "ready", connections: [
      ...(current.workspaceId === workspaceId ? current.connections : []).filter((item) =>
        item.projectId !== scope.projectId || item.provider !== provider), ...(connection ? [connection] : []),
    ] }));
    setRevision((value) => value + 1);
  }, [workspaceId]);
  const visible = enabled && resource.workspaceId === workspaceId ? resource :
    { workspaceId, connections: [], state: "loading" as const };
  return { ...visible, refresh, update };
}
