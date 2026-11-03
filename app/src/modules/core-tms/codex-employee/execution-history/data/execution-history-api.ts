import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { ExecutionHistoryScope, ExecutionHistoryPage } from "../domain/execution-history";
export async function listExecutionHistory(http: TmsHttpClient, scope: ExecutionHistoryScope, cursor: string | null, signal: AbortSignal, limit = 30): Promise<ExecutionHistoryPage> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 30) throw new Error("Invalid execution history page budget");
    const query = new URLSearchParams({ workspaceId: scope.workspaceId, projectId: scope.projectId, runId: scope.runId, itemId: scope.itemId, limit: String(limit) });
    if (scope.attemptNo !== undefined)
        query.set("attemptNo", String(scope.attemptNo));
    if (scope.stepId)
        query.set("stepId", scope.stepId);
    if (cursor)
        query.set("cursor", cursor);
    const result = await http.get<components["schemas"]["ExecutionHistoryEnvelope"]>(`/execution-history?${query}`, signal);
    if (result.data.length > limit || result.data.some(event => event.workspaceId !== scope.workspaceId || event.projectId !== scope.projectId ||
        event.runId !== scope.runId || event.itemId !== scope.itemId || (scope.attemptNo !== undefined && event.attemptNo !== scope.attemptNo) ||
        (scope.stepId !== undefined && event.stepId !== scope.stepId) || (event.kind === "step_result_recorded" && !event.stepId)))
        throw new Error("Execution history scope mismatch");
    if (result.meta.hasMore !== Boolean(result.meta.nextCursor))
        throw new Error("Execution history cursor mismatch");
    return { items: result.data.map(event => ({ id: event.id, workspaceId: event.workspaceId, projectId: event.projectId,
            runId: event.runId, itemId: event.itemId, attemptNo: event.attemptNo, ...(event.stepId ? { stepId: event.stepId } : {}), kind: event.kind, status: event.status,
            actor: event.actor, actorIdentityId: event.actorIdentityId, ...(event.actorKind ? { actorKind: event.actorKind } : {}),
            ...(event.actorProvider ? { actorProvider: event.actorProvider } : {}), ...(event.initiatedBy ? { initiatedBy: { ...event.initiatedBy } } : {}), createdAt: event.createdAt })),
        nextCursor: result.meta.hasMore ? result.meta.nextCursor : null };
}
