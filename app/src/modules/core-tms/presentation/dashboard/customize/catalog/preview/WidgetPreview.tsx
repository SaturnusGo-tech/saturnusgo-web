import { Activity, Bug, Check, Code2, FileText, Layers3, Link2, ListChecks, Play, RotateCcw, Tags } from "lucide-react";
import type { ReactNode } from "react";
import type { WidgetDefinition } from "../../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { catalogCopy } from "../model/catalog-copy";
import styles from "./preview.module.css";
import { usePreviewFit } from "./usePreviewFit";

function ExampleGraphic({ widget }: { widget: WidgetDefinition }) {
  const key = widget.key;
  if (key === "trend") return <svg className={styles.chart} viewBox="0 0 240 90" aria-hidden="true">
    <path d="M5 12V80H235M5 55H235M5 30H235" fill="none" stroke="currentColor" opacity=".12" />
    <path d="M5 69C20 55 25 76 42 52S64 70 80 38S108 53 125 27S147 63 165 41S191 50 205 23S225 16 235 12" fill="none" stroke="var(--preview-green)" strokeWidth="2.5" />
    <path d="M5 75C20 67 25 80 42 65S64 75 80 61S108 65 125 48S147 73 165 57S191 65 205 43S225 44 235 35" fill="none" stroke="var(--preview-blue)" strokeWidth="2.5" />
  </svg>;
  if (["defects", "outcomes", "types"].includes(key)) return <div className={styles.breakdown}>
    <div className={styles.total}><strong>—</strong><Layers3 size={27} /></div>
    <div className={styles.stacked}><i /><i /><i /></div>
    <div className={styles.legend}><span><i />—</span><span><i />—</span><span><i />—</span></div>
  </div>;
  if (["coverage", "portfolio", "queue", "freshness", "tags"].includes(key)) return <div className={styles.rows}>
    {[0, 1, 2].map((row) => <div key={row}><span>{key === "tags" ? <Tags size={13} /> : key === "queue" ? <Play size={12} /> : <i />}</span>
      <div><i style={{ width: `${82 - row * 19}%` }} /></div><small>—</small></div>)}
  </div>;
  const Icon = key === "readyForRetest" ? RotateCcw : key.startsWith("defect:") || key.includes("Defect") ? Bug
    : key === "type:automated" ? Code2 : key === "type:checklist" ? ListChecks : key.includes("Cases") || key.startsWith("type:") ? FileText
      : key === "linkedDefects" ? Link2 : key === "passedRuns" ? Check : Activity;
  return <div className={styles.metric}><strong>—</strong><Icon size={39} strokeWidth={1.4} /></div>;
}

export function WidgetPreview({ widget, compact = false, renderPreview }: {
  widget: WidgetDefinition; compact?: boolean; renderPreview?: (key: string) => ReactNode;
}) {
  const { locale } = useTmsLocale();
  const preview = renderPreview?.(widget.key);
  const fit = usePreviewFit(compact && Boolean(preview));
  return <div className={styles.preview} data-compact={compact} data-example={!preview}
    data-accent={widget.key === "readyForRetest"} aria-hidden="true" ref={(node) => { fit.viewportRef.current = node; node?.setAttribute("inert", ""); }}>
    {preview ? <div ref={fit.contentRef} className={styles.actual} style={fit.style}>{preview}</div> : <div className={styles.example}>
      <span className={styles.exampleTitle}>{locale === "ru" ? widget.ru : widget.en}</span>
      <ExampleGraphic widget={widget} /><span className={styles.exampleLabel}>{catalogCopy(locale).example}</span>
    </div>}
  </div>;
}
