import type { components } from "../../../../../core/tms/generated/tms-api";
export type WorkspaceTransitionTarget = components["schemas"]["WorkspaceTransitionTarget"];
export type WorkspaceHandoffStart = components["schemas"]["WorkspaceHandoffStart"];
export type WorkspaceHandoffNavigation = { readonly kind: "desktop"; readonly url: string } | { readonly kind: "browser"; readonly action: string; readonly fields: WorkspaceHandoffStart };
export interface WorkspaceHandoffPort { target(workspaceId: string, signal: AbortSignal): Promise<WorkspaceTransitionTarget> }
