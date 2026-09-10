import type { CompanyEntrypoint, CompanySession, LoginFields, MfaEnrollment, MfaResult } from "../domain/managed-access";

export interface ManagedAccessPort {
  entrypoint(signal?: AbortSignal): Promise<CompanyEntrypoint>;
  session(signal?: AbortSignal): Promise<CompanySession>;
  login(fields: LoginFields, signal?: AbortSignal): Promise<void>;
  firstPassword(password: string, signal?: AbortSignal): Promise<void>;
  prepareMfa(signal?: AbortSignal): Promise<MfaEnrollment>;
  verifyMfa(kind: "totp" | "recovery", code: string, signal?: AbortSignal): Promise<MfaResult>;
  logout(signal?: AbortSignal): Promise<void>;
}
