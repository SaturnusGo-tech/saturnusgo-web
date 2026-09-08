import { Activity, ArrowUpRight, BarChart3, Blocks, Bug, ChartNoAxesCombined, Check, CircleCheck, CircleDashed,
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
export function WidgetCard({ widget, added, onAdd }: {widget:WidgetDefinition;added:boolean;onAdd:()=>void}) {
  const {locale,t}=useTmsLocale();const Icon=icons[widget.key] ?? (widget.key.startsWith("defect:")?Bug:Timer);
  const title=locale==="ru"?widget.ru:widget.en;
  const cover=widget.group==="live"?"activity":widget.group==="history"?"analytics":"library";
  return <article className={styles.card}>
    <div className={styles.cover}>
      <img src={`/falcon/dashboard/cover-${cover}.webp`} width={1536} height={1024} loading="lazy" alt="" />
      <span className={styles.icon} aria-hidden="true"><Icon size={23} strokeWidth={1.5} /></span>
      <span className={styles.category}>{t(`dashboardLayout.${widget.group}`)}</span>
    </div>
    <div className={styles.cardBody}><h3>{title}</h3><p>{locale==="ru"?widget.hintRu:widget.hintEn}</p>
      <div className={styles.cardFooter}><span><ArrowUpRight size={12}/>{widget.width===3?t("dashboardLayout.metricKind"):t("dashboardLayout.visualKind")}</span>
        <button type="button" disabled={added} onClick={onAdd} aria-label={`${added?t("dashboardLayout.added"):t("dashboardLayout.add")}: ${title}`}>
          {added?<Check size={13}/>:<Plus size={13}/>} {t(added?"dashboardLayout.added":"dashboardLayout.install")}
        </button>
      </div>
    </div>
  </article>;
}
