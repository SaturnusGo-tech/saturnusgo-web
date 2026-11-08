import { ChartNoAxesColumnIncreasing, CircleAlert, CircleDashed, Minus } from "lucide-react";
import type { TmsLocale } from "../../../localization/model/locale";
import styles from "./property-controls.module.css";

export const priorityLevels = [
  { key: "none", en: "No priority", ru: "Без приоритета" },
  { key: "critical", en: "Urgent", ru: "Срочный" },
  { key: "high", en: "High", ru: "Высокий" },
  { key: "medium", en: "Medium", ru: "Средний" },
  { key: "low", en: "Low", ru: "Низкий" },
] as const;

export type PriorityLevel = (typeof priorityLevels)[number]["key"];

export function priorityLabel(locale: TmsLocale, level: string | null | undefined) {
  return (priorityLevels.find((option) => option.key === level) ?? priorityLevels[0])[locale];
}

export function PriorityIcon({ level, empty = "dash", size = 15 }: {
  level: PriorityLevel | null | undefined;
  empty?: "dash" | "circle";
  size?: number;
}) {
  if (!level || level === "none") {
    const Icon = empty === "circle" ? CircleDashed : Minus;
    return <Icon size={size} aria-hidden="true" />;
  }
  if (level === "critical") return <CircleAlert size={size} aria-hidden="true" />;
  return <ChartNoAxesColumnIncreasing size={size} strokeWidth={3.3} className={styles.prioritySignal}
    data-level={level} aria-hidden="true" />;
}
