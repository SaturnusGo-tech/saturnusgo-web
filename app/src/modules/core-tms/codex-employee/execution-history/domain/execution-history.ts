import type { components, operations } from "../../../../../core/tms/generated/tms-api";
export type ExecutionHistoryScope = Readonly<Pick<operations["listExecutionHistory"]["parameters"]["query"], "workspaceId" | "projectId" | "runId" | "itemId" | "attemptNo" | "stepId">>;
export type ExecutionHistoryEvent = Readonly<components["schemas"]["ExecutionHistoryEvent"]>;
export interface ExecutionHistoryPage {
    readonly items: readonly ExecutionHistoryEvent[];
    readonly nextCursor: string | null;
}
