export const planRequestStatuses = [
  "requested", "contacted", "approved", "activating", "active", "declined", "withdrawn", "expired", "revoked",
] as const;

export type PlanRequestStatus = typeof planRequestStatuses[number];
export type PlanRequestAction = "contact" | "approve" | "decline" | "revoke" | "reissue" | "retry";
export type PlanRequestSummary = {
  readonly id: string;
  readonly reference: string;
  readonly planId: "individual" | "startup" | "enterprise";
  readonly status: PlanRequestStatus;
  readonly locale: "ru" | "en";
  readonly workspaceId: string;
  readonly workspaceName: string;
  readonly workspaceKind: "personal" | "company";
  readonly applicantName: string;
  readonly applicantEmail: string;
  readonly note: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
  readonly activationExpiresAt: string | null;
  readonly accessEndsAt: string | null;
  readonly setupId: string | null;
  readonly companyHostname: string | null;
  readonly preparationError: string | null;
  readonly actions: readonly string[];
};
export type PlanRequestDetail = PlanRequestSummary & {
  readonly applicantIdentityId: string;
  readonly applicantRole: string;
  readonly durationDays: number | null;
  readonly basis: "pilot";
  readonly access: { readonly planId: PlanRequestSummary["planId"]; readonly endsAt: string | null } | null;
  readonly history: readonly { action: string; actorLabel: string | null; note: string | null; createdAt: string }[];
  readonly mail: readonly { kind: string; status: string; attempts: number; errorCode: string | null }[];
};
export type PlanRequestChange = {
  readonly expectedVersion: number;
  readonly note?: string;
  readonly reason?: string;
  readonly durationDays?: number;
};
