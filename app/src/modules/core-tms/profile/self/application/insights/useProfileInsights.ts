"use client";
import { useEffect, useState } from "react";
import type { SelfProfileActivity, SelfProfilePort } from "../../domain/profile-model";
import type { ProfileAchievements } from "../../domain/achievements/profile-achievement-model";

type Result<T> = { key: string; value: T | null; loading: boolean; error: unknown };
export function useProfileInsights(client: SelfProfilePort, workspaceId: string | null, year: number) {
  const key = `${workspaceId ?? ""}:${year}`, achievementKey = workspaceId ?? "", [revision, refresh] = useState(0);
  const [calendar, setCalendar] = useState<Result<SelfProfileActivity>>({ key, value: null, loading: true, error: null });
  const [achievements, setAchievements] = useState<Result<ProfileAchievements>>({ key: achievementKey, value: null, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setCalendar({ key, value: null, loading: Boolean(workspaceId), error: null });
    if (!workspaceId) return () => controller.abort();
    client.calendar(workspaceId, year, controller.signal)
      .then(value => { if (!controller.signal.aborted) setCalendar({ key, value, loading: false, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setCalendar({ key, value: null, loading: false, error }); });
    return () => controller.abort();
  }, [client, workspaceId, year, key, revision]);
  useEffect(() => {
    const controller = new AbortController();
    setAchievements({ key: achievementKey, value: null, loading: Boolean(workspaceId), error: null });
    if (!workspaceId) return () => controller.abort();
    client.achievements(workspaceId, controller.signal)
      .then(value => { if (!controller.signal.aborted) setAchievements({ key: achievementKey, value, loading: false, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setAchievements({ key: achievementKey, value: null, loading: false, error }); });
    return () => controller.abort();
  }, [client, workspaceId, achievementKey, revision]);
  const current = <T,>(state: Result<T>, expected: string) => state.key === expected ? state : { key: expected, value: null, error: null, loading: Boolean(workspaceId) };
  return { calendar: current(calendar, key), achievements: current(achievements, achievementKey), retry: () => refresh(value => value + 1) };
}
