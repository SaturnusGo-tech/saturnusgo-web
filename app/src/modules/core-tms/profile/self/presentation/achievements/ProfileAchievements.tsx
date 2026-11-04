"use client";
import { ChevronDown, LockKeyhole, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { achievementCatalog, achievementProgress } from "../../content/achievement-catalog";
import type { ProfileAchievements as Progress } from "../../domain/achievements/profile-achievement-model";
import { AchievementDetail } from "./detail/AchievementDetail";
import styles from "./profile-achievements.module.css";

export function ProfileAchievements({ value, loading, error, ru, retry }: {
  value: Progress | null; loading: boolean; error: unknown; ru: boolean; retry: () => void;
}) {
  const [expanded, setExpanded] = useState(false), [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const openFromUrl = () => {
      const slug = new URLSearchParams(window.location.search).get("achievement");
      setSelected(achievementCatalog.some(story => story.slug === slug) ? slug : null);
    };
    openFromUrl(); window.addEventListener("popstate", openFromUrl);
    return () => window.removeEventListener("popstate", openFromUrl);
  }, []);
  const close = () => {
    setSelected(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has("achievement")) { url.searchParams.delete("achievement"); window.history.replaceState(window.history.state, "", url); }
  };
  const entries = achievementProgress(achievementCatalog, value), earned = entries.filter(item => item.progress?.status === "earned").length;
  const detail = entries.find(item => item.story.slug === selected);
  const visible = expanded ? entries : entries.slice(0, 8);
  return <section className={styles.collection} aria-label={ru ? "Достижения" : "Achievements"} aria-busy={loading}>
    <header><h2>{ru ? "Достижения" : "Achievements"}</h2><span>{value ? earned : "—"}<span> / 40</span></span></header>
    <div className={styles.badges}>{visible.map(({ story, progress }) => {
      const name = ru ? story.nameRu : story.nameEn, locked = progress?.status === "locked";
      return <button type="button" key={story.slug} className={styles.badge} data-locked={locked || undefined} onClick={() => setSelected(story.slug)} title={name}
        aria-label={`${name} · ${progress ? progress.status === "earned" ? (ru ? "Получено" : "Earned") : (ru ? "Ещё не получено" : "Locked") : (ru ? "Узнать о достижении" : "About this achievement")}`}>
        <img src={story.image} alt="" width={76} height={76} loading="lazy" />{locked && <span className={styles.lock}><LockKeyhole size={13} strokeWidth={2} /></span>}
      </button>;
    })}</div>
    {!!error && <button type="button" className={styles.retry} onClick={retry}><RefreshCw size={12} />{ru ? "Повторить загрузку" : "Reload achievements"}</button>}
    <button type="button" className={styles.expand} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? (ru ? "Свернуть коллекцию" : "Show less") : (ru ? "Все 40 достижений" : "All 40 achievements")}<ChevronDown size={13} data-expanded={expanded} /></button>
    {detail && <AchievementDetail story={detail.story} progress={detail.progress} ru={ru} onClose={close} />}
  </section>;
}
