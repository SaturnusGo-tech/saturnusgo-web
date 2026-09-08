import { Activity, BarChart3, Blocks, Bug, ChartNoAxesCombined, Check, CircleCheck, CircleDashed,
  ClipboardCheck, Clock3, Code2, FileClock, Files, GitBranch, Hash, Layers3, Link2, ListChecks, Play, Plus,
  RotateCcw, ShieldAlert, Tags, Target, Timer, TrendingUp, type LucideIcon } from "lucide-react";
import type { WidgetDefinition } from "../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "./catalog.module.css";

const icons: Record<string,LucideIcon> = {
  activeRuns:Play, readyForRetest:RotateCcw, blockedItems:ShieldAlert, openDefects:Bug,
  trend:ChartNoAxesCombined, queue:ListChecks, portfolio:Blocks, freshness:Clock3,
  types:Layers3, tags:Tags, coverage:Target, defects:GitBranch, outcomes:BarChart3,
  notRunItems:CircleDashed, inProgressItems:Activity, outdatedItems:FileClock, runsWithoutBuild:Hash,
  currentCases:Files,casesCreated:Plus,runsLaunched:Play,completedRuns:ClipboardCheck,passedRuns:CircleCheck,
  passRate:TrendingUp,currentDefects:Bug,reportedDefects:ShieldAlert,linkedDefects:Link2,
  "type:manual":ClipboardCheck,"type:automated":Code2,"type:checklist":ListChecks,
};
export function WidgetEntry({ widget, added, onAdd }: {widget:WidgetDefinition;added:boolean;onAdd:()=>void}) {
  const {locale,t}=useTmsLocale();const Icon=icons[widget.key] ?? (widget.key.startsWith("defect:")?Bug:Timer);
  const title=locale==="ru"?widget.ru:widget.en;
  return <article className={styles.entry}>
    <span className={styles.icon} aria-hidden="true"><Icon size={25} strokeWidth={1.45} /></span>
    <div className={styles.description}>
      <h3>{title}</h3>
      <p>{locale === "ru" ? widget.hintRu : widget.hintEn}</p>
    </div>
    <button className={styles.install} type="button" disabled={added} onClick={onAdd}
      aria-label={`${added ? t("dashboardLayout.added") : t("dashboardLayout.add")}: ${title}`}>
      {added ? <Check size={14} /> : <Plus size={14} />}
      <span>{t(added ? "dashboardLayout.added" : "dashboardLayout.install")}</span>
    </button>
  </article>;
}
