import type { components } from "../../../../../core/tms/generated/tms-api";
export type CodexEmployee = Readonly<Omit<components["schemas"]["CodexEmployeeStatus"], "securityVersion"> & {
    etag: string | null;
}>;
export type PersonalCodexConnection = Readonly<components["schemas"]["FalconMcpConnection"]>;
export interface CodexEmployeePort {
    status(signal: AbortSignal): Promise<CodexEmployee>;
    connections(signal: AbortSignal): Promise<readonly PersonalCodexConnection[]>;
    deactivate(employee: CodexEmployee, commandId: string, signal: AbortSignal): Promise<void>;
    revoke(grantId: string, signal: AbortSignal): Promise<void>;
}
