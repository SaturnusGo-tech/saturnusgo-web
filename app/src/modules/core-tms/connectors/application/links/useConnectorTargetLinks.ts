"use client";
import { useEffect, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { connectorApi } from "../../data/connector-api";
import type { Link, Scope } from "../../model/connector-types";
export function useConnectorTargetLinks(scope: Scope, targetId: string) {
  const http = useTmsHttpClient();
  const key = JSON.stringify([scope.workspaceId, scope.projectId, targetId]);
  const [resource, setResource] = useState<{ key: string; links: Link[];
    status: "loading" | "ready" | "error" }>({ key: "", links: [], status: "loading" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setResource({ key, links: [], status: "loading" });
    void connectorApi(http).targetLinks({ workspaceId: scope.workspaceId, projectId: scope.projectId }, targetId, controller.signal)
      .then((links) => { if (!controller.signal.aborted) setResource({ key, links, status: "ready" }); })
      .catch(() => { if (!controller.signal.aborted) setResource({ key, links: [], status: "error" }); });
    return () => controller.abort();
  }, [http, scope.workspaceId, scope.projectId, targetId, key, revision]);
  const visible = resource.key === key ? resource : { links: [], status: "loading" as const };
  return { ...visible, retry: () => setRevision((v) => v + 1) };
}
