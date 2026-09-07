import type { Scope, Snapshot, ReportRepublish } from "../../model/connector-types";
import type { RepublishOperationKeys } from "./republish-operation-keys";
import { TmsApiError } from "../../../../../core/tms/transport/http";

export async function republishReport(input: {
  scope: Scope; connectionId: string; runId: string; etag: string; signal: AbortSignal;
}, ports: {
  keys: RepublishOperationKeys;
  accept: (scope: Scope, runId: string, etag: string, key: string, signal: AbortSignal) => Promise<{ data: ReportRepublish }>;
  refresh: (scope: Scope, signal: AbortSignal) => Promise<Pick<Snapshot, "deliveries" | "links" | "nextCursor">>;
}) {
  const { scope, connectionId, runId, etag, signal } = input;
  signal.throwIfAborted();
  const target = JSON.stringify([scope.workspaceId, scope.projectId, connectionId, runId]);
  const request = ports.keys.begin(target, etag);
  try { await ports.accept(scope, runId, request.etag, request.key, signal); }
  catch (failure) {
    if (failure instanceof TmsApiError && failure.code === "PRECONDITION_FAILED") ports.keys.complete(target, request.key);
    throw failure;
  }
  signal.throwIfAborted();
  const activity = await ports.refresh(scope, signal);
  signal.throwIfAborted();
  ports.keys.complete(target, request.key);
  return activity;
}
