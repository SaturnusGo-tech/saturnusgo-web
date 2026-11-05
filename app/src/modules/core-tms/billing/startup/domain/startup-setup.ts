import type { components } from "../../../../../core/tms/generated/tms-api";
export type StartupSetup = components["schemas"]["StartupSetup"];
export type StartupSetupInput = Omit<components["schemas"]["StartupSetupRequest"], "workspaceId" | "expectedVersion" | "idempotencyKey">;
export interface StartupSetupPort {
  read(workspaceId: string, signal: AbortSignal): Promise<StartupSetup | null>;
  save(workspaceId: string, input: StartupSetupInput, version: number | null, key: string, signal: AbortSignal): Promise<StartupSetup>;
  retry(workspaceId: string, version: number, key: string, signal: AbortSignal): Promise<StartupSetup>;
}
