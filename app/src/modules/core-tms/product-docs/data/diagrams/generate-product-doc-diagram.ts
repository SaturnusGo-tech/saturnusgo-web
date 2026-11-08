import type { components } from "../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { ProductDocScope } from "../../domain/product-docs";

export async function generateProductDocDiagram(http: TmsHttpClient, scope: ProductDocScope, prompt: string, signal: AbortSignal) {
  const { workspaceId, projectId } = scope;
  const { data } = await http.mutateResource<components["schemas"]["ProductDocDiagram"]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/projects/${encodeURIComponent(projectId)}/product-docs/diagram`,
    "POST", { prompt } satisfies components["schemas"]["ProductDocDiagramInput"], { signal },
  );
  return data.source;
}

export function productDocDiagramErrorStatus(error: unknown) {
  return error instanceof TmsApiError ? error.status : undefined;
}
