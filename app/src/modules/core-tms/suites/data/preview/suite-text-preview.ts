import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";

type Api = components["schemas"];
export async function loadSuiteTextMatches(http: TmsHttpClient, projectId: string, text: string, signal: AbortSignal): Promise<ReadonlySet<string>> {
  const ids = new Set<string>(); const cursors = new Set<string>(); let cursor: string | null = null;
  for (let page = 0; page < 100; page++) {
    signal.throwIfAborted();
    const query = new URLSearchParams({ projectId, search: text, limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const result = await http.get<Api["TestCaseListEnvelope"]>(`/test-cases?${query}`, signal);
    result.data.forEach(item => { if (item.projectId === projectId) ids.add(item.id); });
    if (!result.meta.hasMore) return ids;
    if (!result.meta.nextCursor || cursors.has(result.meta.nextCursor)) throw new Error("Suite text preview did not finish loading.");
    cursor = result.meta.nextCursor; cursors.add(cursor);
  }
  throw new Error("Suite text preview exceeds the supported 10,000-case limit.");
}
