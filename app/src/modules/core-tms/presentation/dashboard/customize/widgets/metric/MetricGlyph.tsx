import { Bot, Bug, CheckCheck, CircleCheck, CircleDot, ClipboardCheck, FilePlus2, Layers,
  Link2, ListChecks, MousePointer2, RefreshCw, Send, ShieldCheck, Timer, type LucideIcon } from "lucide-react";
import styles from "./metric.module.css";

const icons: Record<string, LucideIcon> = {
  readyForRetest: ClipboardCheck, currentCases: Layers, casesCreated: FilePlus2, runsLaunched: Send,
  completedRuns: CircleCheck, passedRuns: CheckCheck, currentDefects: Bug, reportedDefects: CircleDot,
  linkedDefects: Link2, "type:manual": MousePointer2, "type:automated": Bot, "type:checklist": ListChecks,
  "defect:open": CircleDot, "defect:triaged": ListChecks, "defect:in_progress": Timer,
  "defect:ready_for_retest": ClipboardCheck, "defect:verified": ShieldCheck,
  "defect:closed": CircleCheck, "defect:reopened": RefreshCw,
};

export function MetricGlyph({ metric, value }: { metric: string; value: number | null | undefined }) {
  if (metric === "passRate") {
    const percent = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, value));
    return <svg className={styles.ring} viewBox="0 0 80 80" aria-hidden="true">
      <circle className={styles.ringTrack} cx="40" cy="40" r="32" />
      <circle className={styles.ringValue} cx="40" cy="40" r="32" pathLength="100"
        strokeDasharray={`${percent} 100`} transform="rotate(-90 40 40)" />
      <CheckCheck x="26" y="26" width="28" height="28" strokeWidth={1.5} />
    </svg>;
  }
  const Icon = icons[metric] ?? Layers;
  return <Icon className={styles.glyph} size={39} strokeWidth={1.45} aria-hidden="true" />;
}
