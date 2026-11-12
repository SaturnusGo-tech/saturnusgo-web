export const CHANGE_STORY_DURATION = 50000;
export const STORY_DURATION = CHANGE_STORY_DURATION;
export type StoryPhase = 'prompt' | 'context' | 'cases' | 'guide' | 'browser' | 'finale';
export function clampStoryTime(time: number): number {
  return Number.isNaN(time) ? 0 : Math.max(0, Math.min(CHANGE_STORY_DURATION, time));
}
export function getStoryPhase(time: number): StoryPhase {
  const elapsed = clampStoryTime(time);
  if (elapsed < 3200) return 'prompt';
  if (elapsed < 9500) return 'context';
  if (elapsed < 15500) return 'cases';
  if (elapsed < 22000) return 'guide';
  if (elapsed < 44000) return 'browser';
  return 'finale';
}
