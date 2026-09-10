import type { components, operations } from "../../../../core/tms/generated/tms-api";

type Api = components["schemas"];
export type AdministrationEvent = Api["AdministrationEvent"];
export type Company = Api["Company"];
export type CompanyDraft = Api["CompanyDraft"];
export type CompanyChange = Api["CompanyChange"];
export type CompanyLegal = Api["CompanyLegal"];
export type CompanyMember = Api["CompanyMember"];
export type MemberDraft = Api["CompanyMemberDraft"];
export type MemberChange = Api["CompanyMemberChange"];
export type MemberMutation = Api["CompanyMemberMutation"];
export type Profile = Api["ManagedProfile"];
export type ProfileDetails = Api["ManagedProfileDetails"];
export type PasswordChange = Api["ManagedPasswordChange"];
export type SessionReauthentication = Api["ManagedReauthentication"];
export type DeviceSession = Api["ManagedDeviceSession"];
export type CompanyOptions = operations["getCompanyProvisioningOptions"]["responses"][200]["content"]["application/json"]["data"];
export type CompanyCreated = operations["createManagedCompany"]["responses"][201]["content"]["application/json"]["data"];
export interface ResultPage<T> { readonly items: readonly T[]; readonly nextCursor: string | null }
export class AdministrationError extends Error {
  constructor(readonly code: string, readonly requestId?: string | null) { super(code); }
}
