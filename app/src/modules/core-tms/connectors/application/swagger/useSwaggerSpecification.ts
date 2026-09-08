"use client";
import { useEffect, useState } from "react";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { connectorError } from "../connector-errors";
import type { Scope } from "../../model/connector-types";
import { loadSwaggerSpecification } from "../../data/swagger/swagger-api";
import type { SwaggerSpecification } from "../../model/swagger/swagger-specification";
type State = { status: "loading" | "empty" | "error" | "ready"; specification: SwaggerSpecification | null; error: string | null };
export function useSwaggerSpecification(scope: Scope, ru: boolean) {
  const http = useTmsHttpClient();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<State>({ status: "loading", specification: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", specification: null, error: null });
    void loadSwaggerSpecification(http, scope, controller.signal).then((specification) => {
      if (!controller.signal.aborted) setState({ status: "ready", specification, error: null });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setState({ status: error instanceof TmsApiError && error.code === "CONNECTION_NOT_FOUND" ? "empty" : "error",
        specification: null, error: connectorError(error, ru) });
    });
    return () => controller.abort();
  }, [http, scope.workspaceId, scope.projectId, revision, ru]);
  return { ...state, reload: () => setRevision((value) => value + 1) };
}
