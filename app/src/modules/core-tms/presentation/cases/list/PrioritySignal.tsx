import { Diamond, Triangle } from "lucide-react";

import styles from "./prioritySignal.module.css";

export type PrioritySignalLevel = "low" | "medium" | "high" | "critical";

export const prioritySignalRank: Record<PrioritySignalLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function isPrioritySignalLevel(value: string | null | undefined): value is PrioritySignalLevel {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

export function PrioritySignal({ priority, label, size = 14, className }: {
  priority: PrioritySignalLevel;
  label: string;
  size?: number;
  className?: string;
}) {
  const Icon = priority === "low" ? Diamond : Triangle;
  const filled = priority === "high" || priority === "critical";

  return <Icon
    className={[styles.signal, className].filter(Boolean).join(" ")}
    data-priority={priority}
    size={size}
    fill={filled ? "currentColor" : "none"}
    strokeWidth={filled ? 1.55 : 1.8}
    aria-label={label}
  />;
}
