import type { components } from "../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { mapRun } from "../../data/run-mapper";
import type { VerificationQueueEnvelope, VerificationRunEnvelope, VerificationRunRequest } from "../model/verification";

export async function getVerificationQueue(http: TmsHttpClient, projectId: string,
  offset = 0, signal?: AbortSignal, defectId?: string) {
  const query = new URLSearchParams({ offset: String(offset), limit: "50" });
  if (defectId) query.set("defectId", defectId);
  const page = await http.get<VerificationQueueEnvelope>(
    `/projects/${encodeURIComponent(projectId)}/verification-queue?${query}`, signal);
  if (!/^[a-f0-9]{64}$/i.test(page.data.scopeToken)) {
    throw new TmsApiError("Invalid verification queue scope", 502, null);
  }
  return page;
}

export function getRunVerification(http: TmsHttpClient, runId: string,
  caseId: string | null, offset = 0, signal?: AbortSignal) {
  const query = new URLSearchParams({ offset: String(offset), limit: "50" });
  if (caseId) query.set("caseId", caseId);
  return http.get<VerificationRunEnvelope>(`/runs/${encodeURIComponent(runId)}/verification?${query}`, signal);
}

export async function createVerificationRun(http: TmsHttpClient, projectId: string,
  body: VerificationRunRequest, idempotencyKey: string, signal?: AbortSignal) {
  const result = await http.mutateResource<components["schemas"]["Run"]>(
    `/projects/${encodeURIComponent(projectId)}/verification-runs`, "POST", body, { idempotencyKey, signal });
  if (result.data.projectId !== projectId || result.data.status !== "active") {
    throw new TmsApiError("Verification run does not match the requested project or state", 502, null);
  }
  return { data: mapRun(result.data), etag: result.etag };
}
