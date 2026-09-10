import { avatarFileBase64 } from "./avatar-file";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { TmsApiError } from "../../../../core/tms/transport/http";
import type { AdministrationPort } from "../application/ports/administration-port";
import { AdministrationError } from "../domain/administration";
import type { AdministrationEvent, CompanyOptions, Company, CompanyCreated, CompanyMember, MemberMutation, Profile, DeviceSession, ResultPage } from "../domain/administration";

export function createAdministrationClient(http: TmsHttpClient): AdministrationPort {
  const call = async <T>(operation: () => Promise<T>): Promise<T> => {
    try { return await operation(); } catch (error) {
      if (error instanceof TmsApiError) throw new AdministrationError(error.code, error.requestId);
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new AdministrationError("SERVICE_UNAVAILABLE");
    }
  };
  const get = <T>(path: string, signal: AbortSignal) => call(async () => (await http.getResource<T>(path, signal)).data);
  const list = <T>(path: string, search: string, cursor: string | null, signal: AbortSignal): Promise<ResultPage<T>> => call(async () => {
    const query = new URLSearchParams({ limit: "30", ...(search ? { search } : {}), ...(cursor ? { cursor } : {}) });
    const result = await http.get<{ data: T[]; meta: { nextCursor: string | null } }>(`${path}?${query}`, signal);
    return { items: result.data, nextCursor: result.meta.nextCursor };
  });
  const mutate = <T>(path: string, method: "POST" | "PATCH" | "DELETE", body: unknown, signal: AbortSignal, key?: string, version?: number) => call(async () =>
    (await http.mutateResource<T>(path, method, body, { signal, idempotencyKey: key,
      ...(version === undefined ? {} : { ifMatch: `"${version}"` }) })).data);
  const avatarPath = (id: string | null) => id === null ? "/profile/avatar" : `/company/members/${encodeURIComponent(id)}/avatar`;
  return {
    companyOptions: (signal) => get<CompanyOptions>("/platform/company-options", signal),
    ownCompany: (signal) => get<Company>("/company", signal),
    journal: (platform, id, cursor, signal) => list<AdministrationEvent>(platform
      ? (id ? `/platform/companies/${encodeURIComponent(id)}/audit` : "/platform/audit") : "/company/audit", "", cursor, signal),
    avatar: (id, signal) => get(avatarPath(id), signal),
    uploadAvatar: async (id, version, file, key, signal) => {
      const imageBase64 = await avatarFileBase64(file, signal);
      await mutate(avatarPath(id), "POST", { imageBase64 }, signal, key, version);
    },
    removeAvatar: async (id, version, signal) => { await mutate(avatarPath(id), "DELETE", undefined, signal, undefined, version); },
    companies: (search, cursor, signal) => list<Company>("/platform/companies", search, cursor, signal),
    company: (id, signal) => get<Company>(`/platform/companies/${encodeURIComponent(id)}`, signal),
    companyOwner: (id, signal) => get<CompanyMember>(`/platform/companies/${encodeURIComponent(id)}/owner`, signal),
    companyAdministrators: (id, cursor, signal) => list<CompanyMember>(`/platform/companies/${encodeURIComponent(id)}/administrators`, "", cursor, signal),
    recoverCompanyOwner: (id, member, resetMfa, key, signal) => mutate<MemberMutation>(`/platform/companies/${encodeURIComponent(id)}/owner-access`,
      "POST", { identityId: member.identityId, resetMfa }, signal, key, member.version),
    createCompany: (draft, key, signal) => mutate<CompanyCreated>("/platform/companies", "POST", draft, signal, key),
    changeCompany: (company, change, key, signal) => mutate<Company>(`/platform/companies/${encodeURIComponent(company.workspaceId)}`,
      "PATCH", change, signal, key, company.version),
    members: (search, cursor, signal) => list<CompanyMember>("/company/members", search, cursor, signal),
    member: (id, signal) => get<CompanyMember>(`/company/members/${encodeURIComponent(id)}`, signal),
    createMember: (draft, key, signal) => mutate<MemberMutation>("/company/members", "POST", draft, signal, key),
    changeMember: (member, change, key, signal) => mutate<MemberMutation>(`/company/members/${encodeURIComponent(member.identityId)}`,
      "PATCH", change, signal, key, member.version),
    profile: (signal) => get<Profile>("/profile", signal),
    updateProfile: async (profile, details, signal) => { await mutate("/profile", "PATCH", details, signal, undefined, profile.version); },
    password: async (change, signal) => { await mutate("/profile/password", "POST", change, signal); },
    reauthenticate: async (proof, signal) => { await mutate("/profile/reauthenticate", "POST", proof, signal); },
    sessions: (cursor, signal) => list<DeviceSession>("/profile/sessions", "", cursor, signal),
    revokeSession: async (id, signal) => { await mutate(`/profile/sessions/${encodeURIComponent(id)}/revoke`, "POST", undefined, signal); },
  };
}
