import type { components } from "../../../../core/tms/generated/tms-api";
type Api = components["schemas"];
export type ImpactAnalysis = Api["ImpactAnalysis"];
export type ImpactRepository = Api["ImpactRepository"];
export type RepositoryInput = Api["ImpactRepositoryWriteRequest"];
export type ImpactScope = { workspaceId: string; projectId: string };
export type ImpactPermissions = { read: boolean; configure: boolean; review: boolean; manageCases: boolean; audit: boolean };
export function impactPermissions(capabilities: readonly string[], connected = true): ImpactPermissions {
  return { read: connected && capabilities.includes("integration:read"),
    configure: connected && capabilities.includes("integration:manage"),
    review: connected && capabilities.includes("run:manage"),
    manageCases: connected && capabilities.includes("test_case:manage"), audit: connected && capabilities.includes("audit:read") };
}
export type ImpactCommand = { action: "scope"; body: Api["ImpactScopeRequest"] }
  | { action: "approve" | "retry"; body: Record<string, never> }
  | { action: `gaps/${string}/generate`; body: Api["ImpactGapGenerateRequest"] }
  | { action: `gaps/${string}/acknowledge`; body: Api["ImpactGapAcknowledgeRequest"] };
export function impactCommandAllowed(command: ImpactCommand, permissions: ImpactPermissions): boolean {
  return permissions.read && (command.action === "scope" || command.action === "approve" ? permissions.review
    : command.action === "retry" ? permissions.configure : permissions.manageCases);
}
