import { TmsApiError } from "../../../../../core/tms/transport/http";
import type { impactApi } from "../../data/impact-api";
import type { ImpactScope } from "../../model/impact-types";
import type { ImpactOperation, ImpactOperations } from "./impact-operation";
type Api = ReturnType<typeof impactApi>;
export async function executeImpactOperation(input: {
  scope: ImpactScope; id: string; operation: ImpactOperation; signal: AbortSignal; owns: () => boolean;
}, ports: { api: Pick<Api, "command" | "detail">; journal: ImpactOperations;
  accept: (resource: Awaited<ReturnType<Api["detail"]>>) => void }) {
  let accepted = false;
  const check = () => { input.signal.throwIfAborted(); if (!input.owns()) throw new DOMException("Owner changed", "AbortError"); };
  try {
    check();
    const result = await ports.api.command(input.scope, input.id, input.operation.command,
      { ifMatch: input.operation.etag, idempotencyKey: input.operation.key, signal: input.signal });
    accepted = true; check(); ports.accept(result);
    const refreshed = await ports.api.detail(input.scope, input.id, input.signal);
    check(); ports.accept(refreshed); ports.journal.complete(input.operation.key);
  } catch (cause) {
    if (!accepted && cause instanceof TmsApiError && cause.status >= 400 && cause.status < 500
      && ![408, 425, 429].includes(cause.status) && !/(?:IN_PROGRESS|OUTCOME_UNKNOWN|BUSY)/.test(cause.code))
      ports.journal.complete(input.operation.key);
    throw cause;
  }
}
