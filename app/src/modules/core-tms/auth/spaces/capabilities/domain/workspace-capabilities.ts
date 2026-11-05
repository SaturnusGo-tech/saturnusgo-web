import type { components } from "../../../../../../core/tms/generated/tms-api";
export type WorkspaceCapabilities = Readonly<components["schemas"]["CodexSetup"]>;
export type WorkspaceCapabilitiesReader = (workspaceId: string, signal: AbortSignal) => Promise<WorkspaceCapabilities>;
