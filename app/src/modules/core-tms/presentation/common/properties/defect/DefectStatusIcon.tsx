import { Circle, CircleCheck, CircleDashed, CircleDot, CirclePlay, RotateCcw } from "lucide-react";
import styles from "./defectStatusIcon.module.css";

const statusIcons = new Map<string, typeof Circle>([
  ["open", CircleDashed],
  ["triaged", Circle],
  ["in_progress", CirclePlay],
  ["ready_for_retest", CircleDot],
  ["verified", CircleCheck],
  ["closed", CircleCheck],
  ["reopened", RotateCcw],
]);

export function DefectStatusIcon({ status, label }: { status: string; label?: string }) {
  const Icon = statusIcons.get(status) ?? Circle;
  return <span className={styles.icon} data-status={status} role={label ? "img" : undefined}
    aria-hidden={label ? undefined : true} aria-label={label} title={label}>
    <Icon aria-hidden="true" size={14} />
  </span>;
}
