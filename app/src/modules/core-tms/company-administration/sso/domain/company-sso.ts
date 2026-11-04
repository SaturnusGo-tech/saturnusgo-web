import type { components } from "../../../../../core/tms/generated/tms-api";
type Api = components["schemas"];
export type CompanySso = Api["CompanySso"];
export type CompanySsoDraft = Api["CompanySsoDraft"];
export type CompanySsoSubjects = Api["CompanySsoSubjects"];
export type CompanySsoSubjectRequest = Api["CompanySsoSubjectRequest"];
export type SubjectMappingDraft = Pick<CompanySsoSubjectRequest, "subject" | "identityId">;
export type SsoTestRedirect = Api["CompanySsoAuthorization"];
