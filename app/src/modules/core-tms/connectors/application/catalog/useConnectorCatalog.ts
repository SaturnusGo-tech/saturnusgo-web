"use client";
import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { connectorApi } from "../../data/connector-api";
import type { Connection } from "../../model/connector-types";
export function useConnectorCatalog(workspaceId: string, revision: number) {
  const http = useTmsHttpClient();
  const [resource, setResource] = useState<{ workspaceId: string; connections: Connection[];
    state: "loading" | "ready" | "error" }>({ workspaceId: "", connections: [], state: "loading" });
  useEffect(() => {
    const controller = new AbortController(); setResource({ workspaceId, connections: [], state: "loading" });
    void connectorApi(http).list(workspaceId, controller.signal).then((data) => {
      if (!controller.signal.aborted) setResource({ workspaceId, connections: data, state: "ready" });
    }).catch(() => {
      if (!controller.signal.aborted) setResource({ workspaceId, connections: [], state: "error" });
    });
    return () => controller.abort();
  }, [http, workspaceId, revision]);
  return resource.workspaceId === workspaceId ? resource : { connections: [], state: "loading" as const };
}
