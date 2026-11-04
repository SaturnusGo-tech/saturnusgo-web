import type { ProfileAchievements } from "./achievements/profile-achievement-model";
import type { components } from "../../../../../core/tms/generated/tms-api";

export type SelfProfile = components["schemas"]["SelfProfile"];
export type SelfProfileDetails = components["schemas"]["SelfProfileDetails"];
export type SelfProfileActivity = components["schemas"]["SelfProfileActivity"];
export type SelfProfileMediaVersion = components["schemas"]["SelfProfileMediaVersion"];
export type ProfilePeriod = 30 | 90 | 365;
export type ProfileMediaKind = "avatar" | "banner";
export type ActivityMetric = "executedCases" | "authoredCases" | "defects" | "runs";

export interface SelfProfilePort {
  read(signal: AbortSignal): Promise<SelfProfile>;
  update(profile: SelfProfile, details: SelfProfileDetails, signal: AbortSignal): Promise<SelfProfile>;
  upload(profile: SelfProfile, kind: ProfileMediaKind, file: File, key: string, signal: AbortSignal): Promise<SelfProfile>;
  remove(profile: SelfProfile, kind: ProfileMediaKind, signal: AbortSignal): Promise<SelfProfile>;
  achievements(workspaceId: string, signal: AbortSignal): Promise<ProfileAchievements>;
  calendar(workspaceId: string, year: number, signal: AbortSignal): Promise<SelfProfileActivity>;
  activity(workspaceId: string, days: ProfilePeriod, signal: AbortSignal): Promise<SelfProfileActivity>;
}
