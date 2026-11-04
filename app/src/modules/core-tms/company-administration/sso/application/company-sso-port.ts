import type { CompanySso, CompanySsoDraft, CompanySsoSubjectRequest, CompanySsoSubjects, SsoTestRedirect } from "../domain/company-sso";
export interface CompanySsoPort {
  get(signal: AbortSignal): Promise<CompanySso>;
  save(draft: CompanySsoDraft, signal: AbortSignal): Promise<CompanySso>;
  test(signal: AbortSignal): Promise<SsoTestRedirect>;
  enable(version: number, enabled: boolean, signal: AbortSignal): Promise<CompanySso>;
  enforce(version: number, enforced: boolean, signal: AbortSignal): Promise<CompanySso>;
  subjects(signal: AbortSignal): Promise<CompanySsoSubjects>;
  bind(subject: CompanySsoSubjectRequest, signal: AbortSignal): Promise<CompanySsoSubjects>;
}
