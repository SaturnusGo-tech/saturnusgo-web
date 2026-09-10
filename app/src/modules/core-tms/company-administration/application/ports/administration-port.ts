import type { ManagedAvatarGrant } from "../../../auth/managed/domain/managed-avatar";
import type { AdministrationEvent, CompanyOptions, Company, CompanyDraft, CompanyChange, CompanyCreated, CompanyMember, MemberDraft, MemberChange,
  MemberMutation, Profile, ProfileDetails, PasswordChange, SessionReauthentication, DeviceSession, ResultPage } from "../../domain/administration";

export interface AdministrationPort {
  companyOptions(signal: AbortSignal): Promise<CompanyOptions>;
  ownCompany(signal: AbortSignal): Promise<Company>;
  journal(platform: boolean, companyId: string | null, cursor: string | null, signal: AbortSignal): Promise<ResultPage<AdministrationEvent>>;
  avatar(identityId: string | null, signal: AbortSignal): Promise<ManagedAvatarGrant>;
  uploadAvatar(identityId: string | null, version: number, file: Blob, key: string, signal: AbortSignal): Promise<void>;
  removeAvatar(identityId: string | null, version: number, signal: AbortSignal): Promise<void>;
  companies(search: string, cursor: string | null, signal: AbortSignal): Promise<ResultPage<Company>>;
  company(id: string, signal: AbortSignal): Promise<Company>;
  companyOwner(id: string, signal: AbortSignal): Promise<CompanyMember>;
  companyAdministrators(id: string, cursor: string | null, signal: AbortSignal): Promise<ResultPage<CompanyMember>>;
  recoverCompanyOwner(id: string, member: CompanyMember, resetMfa: boolean, key: string, signal: AbortSignal): Promise<MemberMutation>;
  createCompany(draft: CompanyDraft, key: string, signal: AbortSignal): Promise<CompanyCreated>;
  changeCompany(company: Company, change: CompanyChange, key: string, signal: AbortSignal): Promise<Company>;
  members(search: string, cursor: string | null, signal: AbortSignal): Promise<ResultPage<CompanyMember>>;
  member(id: string, signal: AbortSignal): Promise<CompanyMember>;
  createMember(draft: MemberDraft, key: string, signal: AbortSignal): Promise<MemberMutation>;
  changeMember(member: CompanyMember, change: MemberChange, key: string, signal: AbortSignal): Promise<MemberMutation>;
  profile(signal: AbortSignal): Promise<Profile>;
  updateProfile(profile: Profile, details: ProfileDetails, signal: AbortSignal): Promise<void>;
  password(change: PasswordChange, signal: AbortSignal): Promise<void>;
  reauthenticate(proof: SessionReauthentication, signal: AbortSignal): Promise<void>;
  sessions(cursor: string | null, signal: AbortSignal): Promise<ResultPage<DeviceSession>>;
  revokeSession(id: string, signal: AbortSignal): Promise<void>;
}
