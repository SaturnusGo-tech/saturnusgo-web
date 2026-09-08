import { Box, CircleAlert, CircleDashed, FileClock, Play, ShieldAlert, Timer } from "lucide-react";
import type { FreshnessKind } from "./model";

export const freshnessIcons = {
  notRunItems: CircleDashed, inProgressItems: Play, outdatedItems: FileClock, runsWithoutBuild: Box,
  activeRuns: Timer, blockedItems: ShieldAlert, openDefects: CircleAlert,
} satisfies Record<FreshnessKind, typeof Box>;

export const freshnessCopy = {
  ru: {
    context: "Текущая работа в выбранном контексте",
    carousel: "Карусель показателей", slide: "Страница", navigation: "Страница показателей",
    previous: "Предыдущая страница показателей", next: "Следующая страница показателей",
    page: (page: number, total: number) => `${page} из ${total}`,
    metrics: {
      notRunItems: "Не запускались", inProgressItems: "Выполняются", outdatedItems: "Новые ревизии",
      runsWithoutBuild: "Без сборки", activeRuns: "Активные прогоны", blockedItems: "Заблокированы", openDefects: "Открытые дефекты",
    },
    hints: {
      activeRuns: "Прогоны, в которых ещё идёт тестирование",
      blockedItems: "Проверки активных прогонов, которые сейчас нельзя продолжить",
      openDefects: "Незакрытые дефекты в текущей рабочей выборке",
      notRunItems: "", inProgressItems: "", outdatedItems: "", runsWithoutBuild: "",
    },
  },
  en: {
    context: "Current work in the selected context",
    carousel: "Metrics carousel", slide: "Page", navigation: "Metrics page",
    previous: "Previous metrics page", next: "Next metrics page",
    page: (page: number, total: number) => `${page} of ${total}`,
    metrics: {
      notRunItems: "Not started", inProgressItems: "In progress", outdatedItems: "New revisions",
      runsWithoutBuild: "No build", activeRuns: "Active runs", blockedItems: "Blocked checks", openDefects: "Open defects",
    },
    hints: {
      activeRuns: "Runs where testing is still ongoing", blockedItems: "Checks in active runs that cannot proceed",
      openDefects: "Unresolved defects in the current work scope",
      notRunItems: "", inProgressItems: "", outdatedItems: "", runsWithoutBuild: "",
    },
  },
};
