import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { CaseReference } from "../domain/caseReference";

/** Search stays inside an already-authorized project; substring results never become links. */
export async function findExactCaseReferences(client: TmsHttpClient, projectId: string, key: string,
  signal?: AbortSignal): Promise<CaseReference[] | null> {
  const found = new Map<string, CaseReference>();
  const cursors = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < 4; page += 1) {
    const query = new URLSearchParams({ projectId, search: key, includeArchived: "true", limit: "50" });
    if (cursor) query.set("cursor", cursor);
    const envelope = await client.get<components["schemas"]["TestCaseListEnvelope"]>(`/test-cases?${query}`, signal);
    for (const item of envelope.data) {
      if (item.projectId !== projectId || item.key !== key || !item.title.trim()) continue;
      found.set(item.id, { id: item.id, projectId: item.projectId, key: item.key, title: item.title });
    }
    if (found.size > 1 || !envelope.meta.hasMore) return [...found.values()];
    cursor = envelope.meta.nextCursor;
    if (!cursor || cursors.has(cursor)) return null;
    cursors.add(cursor);
  }
  // An incomplete query cannot prove an unambiguous exact reference.
  return null;
}
