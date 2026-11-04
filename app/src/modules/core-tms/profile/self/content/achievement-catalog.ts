import entries from "./achievement-catalog.json";
import type { ProfileAchievement, ProfileAchievements } from "../domain/achievements/profile-achievement-model";

export type AchievementStory = (typeof entries)[number];
export const achievementCatalog: readonly AchievementStory[] = entries;
export function achievementProgress(catalog: readonly AchievementStory[], value: ProfileAchievements | null) {
  const progress = new Map(value?.items.map(item => [item.slug, item]));
  return catalog.map(story => ({ story, progress: progress.get(story.slug)?.id === story.id ? progress.get(story.slug) : undefined }))
    .sort((a, b) => Number(b.progress?.status === "earned") - Number(a.progress?.status === "earned") || a.story.id - b.story.id);
}
export function achievementPercent(progress: ProfileAchievement | undefined) {
  return progress ? progress.status === "earned" ? 100 : Math.min(100, Math.max(0, progress.progress / Math.max(1, progress.target) * 100)) : 0;
}
