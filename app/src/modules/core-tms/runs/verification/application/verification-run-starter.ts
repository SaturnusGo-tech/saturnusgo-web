import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { createVerificationRun } from "../data/verification-api";
import type { VerificationRunRequest } from "../model/verification";

interface PendingStart { key: string; body: VerificationRunRequest }
export function createVerificationRunStarter(http: TmsHttpClient, newKey = () => crypto.randomUUID()) {
  const pending = new Map<string, PendingStart>();
  const active = new Map<string, ReturnType<typeof createVerificationRun>>();
  return {
    pending(projectId: string, defectId?: string) { return pending.get(JSON.stringify([projectId, defectId ?? null]))?.body ?? null; },
    async start(projectId: string, body: VerificationRunRequest, signal?: AbortSignal) {
      const scope = JSON.stringify([projectId, body.defectId ?? null]);
      const running = active.get(scope);
      if (running) return running;
      const operation = pending.get(scope) ?? { key: newKey(), body: { ...body } };
      pending.set(scope, operation);
      const request = createVerificationRun(http, projectId, operation.body, operation.key, signal);
      active.set(scope, request);
      try {
        const result = await request;
        pending.delete(scope);
        return result;
      } catch (error) {
        if (error instanceof TmsApiError && [400, 403, 404, 409, 422].includes(error.status)) {
          pending.delete(scope);
        }
        throw error;
      } finally { if (active.get(scope) === request) active.delete(scope); }
    },
  };
}
