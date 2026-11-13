import type { SelfProfile, SelfProfileActivity, SelfProfilePort } from "../../domain/profile-model";

export const profile: SelfProfile = {
  id: "qa-1", name: "Pat QA", email: "pat@example.test", emailVerified: true, phone: "",
  introduction: "QA engineer", bio: "", location: "", contactUrl: null, accountKind: "personal",
  avatarCharacterId: "mika", hasAvatar: false, hasBanner: false, avatar: null, banner: null, version: 3,
};
export const activity = (label: string) => ({ marker: label } as unknown as SelfProfileActivity);
export function profilePort(overrides: Partial<SelfProfilePort> = {}): SelfProfilePort {
  return {
    read: async () => profile,
    update: async (_profile, details) => ({ ...profile, ...details, version: 4 }),
    upload: async () => ({ ...profile, hasAvatar: true, version: 4 }),
    chooseCharacter: async (_profile, characterId) => ({ ...profile, avatarCharacterId: characterId as SelfProfile["avatarCharacterId"], avatar: null, hasAvatar: false, version: 4 }),
    remove: async () => ({ ...profile, version: 4 }),
    achievements: async () => ({ catalogVersion: 1, items: [] }),
    calendar: async () => activity("calendar"),
    activity: async () => activity("default"),
    ...overrides,
  };
}
