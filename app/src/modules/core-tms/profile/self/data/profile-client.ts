import type { ProfileAchievements } from "../domain/achievements/profile-achievement-model";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { SelfProfile, SelfProfileActivity, SelfProfileMediaVersion, SelfProfilePort } from "../domain/profile-model";
import { avatarFileBase64 } from "../../../company-administration/data/avatar-file";

export function createSelfProfileClient(http: TmsHttpClient): SelfProfilePort {
  const path = "/me/profile";
  const read = async (signal: AbortSignal) => (await http.getResource<SelfProfile>(path, signal)).data;
  const change = async <T,>(profile: SelfProfile, url: string, method: "POST" | "PATCH" | "DELETE", body: unknown, signal: AbortSignal, key?: string) =>
    (await http.mutateResource<T>(url, method, body, { signal, ifMatch: `"${profile.version}"`, idempotencyKey: key })).data;
  return {
    read,
    update: (profile, details, signal) => change<SelfProfile>(profile, path, "PATCH", details, signal),
    upload: async (profile, kind, file, key, signal) => {
      const imageBase64 = await avatarFileBase64(file, signal);
      await change<SelfProfileMediaVersion>(profile, `${path}/${kind}`, "POST", { imageBase64 }, signal, key);
      return read(signal);
    },
    remove: async (profile, kind, signal) => { await change<SelfProfileMediaVersion>(profile, `${path}/${kind}`, "DELETE", undefined, signal); return read(signal); },
    achievements: async (workspaceId, signal) => (await http.getResource<ProfileAchievements>(`${path}/achievements?${new URLSearchParams({ workspaceId })}`, signal)).data,
    calendar: async (workspaceId, year, signal) => (await http.getResource<SelfProfileActivity>(`${path}/activity?${new URLSearchParams({ workspaceId, year: String(year) })}`, signal)).data,
    activity: async (workspaceId, days, signal) => (await http.getResource<SelfProfileActivity>(
      `${path}/activity?${new URLSearchParams({ workspaceId, days: String(days) })}`, signal)).data,
  };
}
