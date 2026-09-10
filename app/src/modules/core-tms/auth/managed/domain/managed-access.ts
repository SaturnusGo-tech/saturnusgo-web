import type { components } from "../../../../../core/tms/generated/tms-api";

export type CompanyEntrypoint = components["schemas"]["ManagedEntrypoint"];
export type CompanySession = components["schemas"]["ManagedSession"];
export type SignedInCompanySession = Extract<CompanySession, { authenticated: true }>;
export type MfaEnrollment = components["schemas"]["ManagedMfaEnrollment"];
export type MfaResult = components["schemas"]["ManagedMfaResponse"];
export type LoginFields = components["schemas"]["ManagedLoginRequest"];
export type AccessStage = CompanySession["stage"];

export class CompanyAccessError extends Error {
  constructor(readonly code: string, readonly requestId?: string) { super(code); this.name = "CompanyAccessError"; }
}
