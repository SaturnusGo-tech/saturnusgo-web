import type { components } from "../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { DefectBrowserAccessError } from "../model/defect-browser-error";
import { mapDefect } from "../../data/defect-mapper";
import type { DefectBrowserQuery, DefectBrowserSource } from "../model/defect-browser";

type Api = components["schemas"];
export function createHttpDefectBrowser(http: TmsHttpClient): DefectBrowserSource {
  async function read<T>(path: string, signal: AbortSignal): Promise<T> {
    try { return await http.get<T>(path, signal); }
    catch (error) {
      signal.throwIfAborted();
      if (error instanceof TmsApiError && [401, 403, 404].includes(error.status)) throw new DefectBrowserAccessError();
      throw error;
    }
  }
  const parameters = (query: DefectBrowserQuery, cursor: string | null) => {
    const params = new URLSearchParams({ projectId: query.projectId, limit: "50" });
    if (query.scope) params.set("scope", query.scope);
    if (query.q) params.set("q", query.q);
    if (cursor) params.set("cursor", cursor);
    return params;
  };
  return {
    async groups(query, cursor, signal) {
      const response = await read<Api["DefectGroupListEnvelope"]>(
        `/defects/groups?${parameters(query, cursor)}`, signal);
      signal.throwIfAborted();
      return { groups: response.data.groups.map((group) => ({ ...group })),
        totals: { ...response.data.totals }, groupCount: response.data.groupCount,
        nextCursor: response.meta.nextCursor };
    },
    async records(query, component, cursor, signal) {
      const params = parameters(query, cursor);
      params.set("component", component);
      if (query.severitySort) params.set("severitySort", query.severitySort);
      const response = await read<Api["DefectListEnvelope"]>(`/defects?${params}`, signal);
      signal.throwIfAborted();
      return { items: response.data.map(mapDefect), nextCursor: response.meta.nextCursor };
    },
  };
}
