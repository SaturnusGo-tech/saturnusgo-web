import type { operations } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { TestDataPort } from "../../application/ports/test-data-port";
type Page = operations["listTdmCredentialUsage"]["responses"][200]["content"]["application/json"];
export function createUsageClient(http: TmsHttpClient, base: string): TestDataPort["usage"] {
  return async (kind, id, cursor, signal) => {
    const query = new URLSearchParams({ limit: "50" }); if (cursor) query.set("cursor", cursor);
    const page = await http.get<Page>(`${base}/${kind}/${encodeURIComponent(id)}/usage?${query}`, signal);
    return { items: page.data.map(item => ({ id: item.caseId, key: item.caseKey, title: item.title })), cursor: page.page.nextCursor };
  };
}
