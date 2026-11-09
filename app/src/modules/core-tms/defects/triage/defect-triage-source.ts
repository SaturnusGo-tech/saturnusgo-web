import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";

type Api = components["schemas"];
export type DefectTriageScope = { workspaceId: string; projectId: string };
export type DefectTriageView = "inbox" | "snoozed";
export type DefectTriageRow = Api["DefectTriageRow"];
export type DefectTriageDecision = { reason?: string } & (
  | { action: "accept" | "decline" | "resume" }
  | { action: "duplicate"; duplicateOfDefectId: string }
  | { action: "snooze"; snoozedUntil: string }
);
export type DefectTriagePage = { rows: DefectTriageRow[]; nextCursor: string | null };
export type DefectTriageCandidate = Pick<Api["Defect"], "id" | "key" | "title">;

export function createDefectTriageSource(http: TmsHttpClient) {
  return {
    async read(scope: DefectTriageScope, view: DefectTriageView, cursor?: string,
      signal?: AbortSignal): Promise<DefectTriagePage> {
      const query = new URLSearchParams({ ...scope, view, limit: "20" });
      if (cursor) query.set("cursor", cursor);
      const { data, meta } = await http.get<Api["DefectTriageListEnvelope"]>(
        `/defects/triage?${query}`, signal,
      );
      if (data.some(row => row.projectId !== scope.projectId)) throw new Error("Triage response has an invalid scope");
      return { rows: data, nextCursor: meta.nextCursor };
    },
    async candidates(projectId: string, search: string, sourceId: string, signal: AbortSignal) {
      const query = new URLSearchParams({ projectId, q: search, limit: "20" });
      const { data, meta } = await http.get<Api["DefectListEnvelope"]>(`/defects?${query}`, signal);
      const rows: DefectTriageCandidate[] = data
        .filter(row => row.projectId === projectId && row.id !== sourceId && !row.triageDuplicateOfDefectId)
        .map(({ id, key, title }) => ({ id, key, title }));
      return { rows, hasMore: meta.hasMore };
    },
    async decide(scope: DefectTriageScope, id: string, expectedVersion: number,
      decision: DefectTriageDecision, idempotencyKey: string) {
      const body: Api["DefectTriageRequest"] = { ...scope, expectedVersion, ...decision, reason: decision.reason ?? "" };
      const { data } = await http.mutateResource<DefectTriageRow>(
        `/defects/${encodeURIComponent(id)}/triage`, "POST", body, { idempotencyKey });
      return data;
    },
  };
}

export type DefectTriageSource = ReturnType<typeof createDefectTriageSource>;
