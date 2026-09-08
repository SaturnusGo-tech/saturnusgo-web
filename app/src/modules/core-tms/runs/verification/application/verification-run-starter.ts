import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { createVerificationRun } from "../data/verification-api";
import type { VerificationRunRequest } from "../model/verification";

interface PendingStart { key: string; body: VerificationRunRequest }
export function createVerificationRunStarter(http: TmsHttpClient, newKey = () => crypto.randomUUID()) {
  const pending = new Map<string, PendingStart>();
  const active = new Map<string, ReturnType<typeof createVerificationRun>>();
  return {
    pending(projectId: string) { return pending.get(projectId)?.body ?? null; },
    async start(projectId: string, body: VerificationRunRequest, signal?: AbortSignal) {
      const running = active.get(projectId);
      if (running) return running;
      const operation = pending.get(projectId) ?? { key: newKey(), body: { ...body } };
      pending.set(projectId, operation);
      const request = createVerificationRun(http, projectId, operation.body, operation.key, signal);
      active.set(projectId, request);
      try {
        const result = await request;
        pending.delete(projectId);
        return result;
      } catch (error) {
        if (error instanceof TmsApiError && [400, 403, 404, 409, 422].includes(error.status)) {
          pending.delete(projectId);
        }
        throw error;
      } finally { if (active.get(projectId) === request) active.delete(projectId); }
    },
  };
}
