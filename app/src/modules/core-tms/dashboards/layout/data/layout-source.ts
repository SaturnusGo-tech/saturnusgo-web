import type { components } from "../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { LayoutError, type LayoutSource } from "../model/layout";
import { mapProjectBoard } from "./layout-mapper";

type Api = components["schemas"];
function failure(error: unknown): never {
  if (error instanceof LayoutError || (error instanceof Error && error.name === "AbortError")) throw error;
  if (error instanceof TmsApiError) {
    throw new LayoutError(error.status === 403 || error.status === 401 ? "permission" :
      error.status === 412 ? "conflict" : error.status === 400 || error.status === 409 ? "invalid" : "unavailable");
  }
  throw new LayoutError("unavailable");
}
export function createLayoutSource(http: TmsHttpClient): LayoutSource {
  return {
    async load(scope, signal) {
      try {
        let cursor: string | null = null;
        let first: Api["DashboardSummary"] | undefined;
        const seen = new Set<string>();
        do {
          const params = new URLSearchParams({ ...scope, projectOnly: "true", status: "active", limit: "100" });
          if (cursor) params.set("cursor", cursor);
          const page = await http.get<Api["DashboardListEnvelope"]>(`/dashboards?${params}`, signal);
          signal.throwIfAborted();
          if (page.data.some((item) => item.projectId !== scope.projectId || item.workspaceId !== scope.workspaceId)) throw new LayoutError("invalid");
          first ??= page.data[0];
          const preferred = page.data.find((item) => item.isDefault);
          if (preferred) { first = preferred; break; }
          cursor = page.meta.nextCursor;
          if (cursor && (seen.has(cursor) || seen.size >= 50)) throw new LayoutError("invalid");
          if (cursor) seen.add(cursor);
        } while (cursor);
        if (!first) return null;
        const result = await http.getResource<Api["Dashboard"]>(`/dashboards/${encodeURIComponent(first.id)}`, signal);
        signal.throwIfAborted();
        return mapProjectBoard(result.data, result.etag, scope);
      } catch (error) { signal.throwIfAborted(); return failure(error); }
    },
    async save(scope, current, draft, key) {
      try {
        const body = current ? { name: draft.name.trim(), widgets: draft.widgets } :
          { ...scope, name: draft.name.trim(), widgets: draft.widgets, isDefault: true };
        const result = await http.mutateResource<Api["Dashboard"]>(current ? `/dashboards/${encodeURIComponent(current.id)}` : "/dashboards",
          current ? "PATCH" : "POST", body, { idempotencyKey: key, ...(current ? { ifMatch: current.etag } : {}) });
        return mapProjectBoard(result.data, result.etag, scope);
      } catch (error) { return failure(error); }
    },
  };
}
