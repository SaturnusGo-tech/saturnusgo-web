"use client";
import { Check, LockKeyhole } from "lucide-react";
import { Modal } from "../../../../../presentation/common/modal/Modal";
import { achievementPercent, type AchievementStory } from "../../../content/achievement-catalog";
import type { ProfileAchievement } from "../../../domain/achievements/profile-achievement-model";
import styles from "./achievement-detail.module.css";

const categories = { coverage: ["Покрытие", "Coverage"], execution: ["Выполнение", "Execution"], defects: ["Дефекты", "Defects"], team: ["Работа в команде", "Teamwork"] };
export function AchievementDetail({ story, progress, ru, onClose }: {
  story: AchievementStory; progress: ProfileAchievement | undefined; ru: boolean; onClose: () => void;
}) {
  const earned = progress?.status === "earned", percent = achievementPercent(progress);
  const category = categories[story.category as keyof typeof categories];
  const date = progress?.earnedAt ? new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(new Date(progress.earnedAt)) : null;
  return <Modal title={ru ? "Достижение" : "Achievement"} onClose={onClose} panelClassName={styles.dialog}>
    <div className={styles.content}>
      <div className={styles.art}><img src={story.image} alt="" width={220} height={220} /><span className={styles.status} data-earned={earned}>{earned ? <Check size={14} /> : <LockKeyhole size={13} />}{earned ? (ru ? "Получено" : "Earned") : progress ? (ru ? "Впереди" : "To discover") : (ru ? "Коллекция Falcon" : "Falcon collection")}</span></div>
      <div className={styles.story}><p className={styles.category}>{category?.[ru ? 0 : 1]}</p><h3>{ru ? story.nameRu : story.nameEn}</h3><p>{ru ? story.storyRu : story.storyEn}</p>
        <section><h4>{ru ? "Как получить" : "How to earn it"}</h4><p>{ru ? story.conditionRu : story.conditionEn}</p></section>
        <section><h4>{ru ? "Что отмечает достижение" : "Why it matters"}</h4><p>{ru ? story.valueRu : story.valueEn}</p></section>
        {progress && <section className={styles.progress}>
          <div><h4>{earned ? (ru ? "Условие выполнено" : "Goal reached") : (ru ? "Ваш прогресс" : "Your progress")}</h4><span>{progress.progress} / {progress.target}</span></div>
          <progress max={100} value={percent} aria-label={ru ? "Прогресс достижения" : "Achievement progress"} />
          {progress.tracking === "requires_recorded_evidence" && !earned && <p className={styles.hint}>{ru ? "Это условие пока не подтверждается данными Falcon; достижение остаётся закрытым." : "Falcon cannot verify this condition yet; it remains locked."}</p>}
        </section>}
        {(date || Boolean(progress?.evidenceCount)) && <dl className={styles.evidence}>{date && <div><dt>{ru ? "Получено" : "Earned on"}</dt><dd>{date}</dd></div>}{Boolean(progress?.evidenceCount) && <div><dt>{ru ? "Подтверждённые действия" : "Verified contributions"}</dt><dd>{progress!.evidenceCount}</dd></div>}</dl>}
      </div>
    </div>
  </Modal>;
}
