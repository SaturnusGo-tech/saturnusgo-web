import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { RunGroup } from "./group-records";
import { DetailProgress, DetailStatus } from "../records/RecordSignals";
import styles from "./groups.module.css";
export function GroupedChecks({ groups, onOpenRow }: { groups: RunGroup[]; onOpenRow: (row: DashboardDrillRow) => void }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru"; const [collapsed, setCollapsed] = useState(new Set<string>());
  return <div className={styles.groups}>{groups.map(group => {
    const closed = collapsed.has(group.key);
    return <section key={group.key} className={styles.group} aria-label={group.run.title}>
      <header><button type="button" className={styles.toggle} aria-expanded={!closed} onClick={() => {
        const next = new Set(collapsed); if (closed) next.delete(group.key); else next.add(group.key); setCollapsed(next);
      }}><ChevronDown size={15} data-closed={closed} /><strong>{group.run.title}</strong><span>{group.rows.length}</span></button>
        {group.run.progress && <DetailProgress progress={group.run.progress} />}
        <button type="button" className={styles.open} onClick={() => onOpenRow(group.run)}>{ru ? "Открыть прогон" : "Open run"}<ArrowUpRight size={14} /></button>
      </header>
      {!closed && <div className={styles.rows}>{group.rows.map(row => <button type="button" key={row.id} className={styles.row} onClick={() => onOpenRow(row)}>
        <span className={styles.key}>{row.caseKey ?? row.key}</span><strong title={row.title}>{row.title}</strong><span className={styles.component}>{row.component || "—"}</span><DetailStatus status={row.status} />
      </button>)}</div>}
    </section>;
  })}</div>;
}
