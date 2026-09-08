import type { WorkbenchProgress } from "../../../../../dashboards/workbench/model/workbench";

export function runProgress(progress: WorkbenchProgress) {
  const total = Math.max(0, progress.total);
  const completed = Math.min(total, progress.passed + progress.failed + progress.blocked + progress.skipped);
  return {
    total, completed, percent: total > 0 ? Math.round(completed / total * 100) : 0,
    segments: (["passed", "failed", "blocked", "skipped", "inProgress", "notRun"] as const)
      .map((kind) => ({ kind, count: progress[kind], percent: total > 0 ? progress[kind] / total * 100 : 0 }))
      .filter((segment) => segment.count > 0),
  };
}

export const queueCopy = {
  ru: { open: "Открыть", continue: "Продолжить", work: "В работе", retest: "Исправления к ретесту",
    completed: (done: string, total: string) => `${done} из ${total} с результатом`,
    passed: "Пройдено", failed: "Не пройдено", blocked: "Заблокировано", skipped: "Пропущено",
    inProgress: "Выполняется", notRun: "Не начато" },
  en: { open: "Open", continue: "Continue", work: "In progress", retest: "Fixes ready for retest",
    completed: (done: string, total: string) => `${done} of ${total} with a result`,
    passed: "Passed", failed: "Failed", blocked: "Blocked", skipped: "Skipped", inProgress: "In progress", notRun: "Not started" },
};
