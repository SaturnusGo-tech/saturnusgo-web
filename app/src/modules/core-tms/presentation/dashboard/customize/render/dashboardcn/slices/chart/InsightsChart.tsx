import type { CSSProperties } from "react";
import { insightAxis, type InsightGroup, type InsightMeasure } from "../model/insight-view";
import styles from "./insights-chart.module.css";

type Props = {
  groups: InsightGroup[];
  number: Intl.NumberFormat;
  label: string;
  selected?: string;
  onSelect?: (item: InsightMeasure) => void;
  updating?: boolean;
  markers?: "person" | "label";
};

export function InsightsChart({ groups, number, label, selected, onSelect, updating, markers = "label" }: Props) {
  const { scale, ticks } = insightAxis(groups.map(group => group.count));
  const labels = groups.length > 0;
  return <div className={styles.chart} aria-label={label}>
    <div className={styles.plotScroll}>
      <div className={styles.plot} style={{ "--groups": Math.max(1, groups.length) } as CSSProperties}>
        <div className={styles.guides} aria-hidden="true">
          {ticks.map(tick => <span key={tick} style={{ insetBlockStart: `${100 - tick / scale * 100}%` }} />)}
        </div>
        <div className={styles.columns}>
          {groups.map(group => {
            const parts = group.cells.length > 0 ? group.cells : [group];
            return <div className={styles.column} key={group.key}>
              <div className={styles.stack}>
                {parts.filter(part => Boolean(part.count)).map(part => {
                  const title = `${group.label}${part === group ? "" : ` · ${part.label}`} · ${number.format(part.count ?? 0)}`;
                  const style = { backgroundColor: part.color, blockSize: `${(part.count ?? 0) / scale * 100}%` };
                  return onSelect && part.drill ? <button type="button" key={part.key} className={styles.mark}
                    style={style} aria-label={title} title={title} aria-pressed={part.drill.id === selected}
                    aria-disabled={updating || undefined} onClick={updating ? undefined : () => onSelect(part)} /> : <span className={styles.mark} key={part.key} style={style} title={title} />;
                })}
              </div>
            </div>;
          })}
        </div>
        <div className={styles.xAxis} data-empty={!labels || undefined}>
          {groups.map(group => <span key={group.key} className={markers === "person" ? styles.avatar : styles.xLabel} title={group.label}>
            {markers === "person" ? group.label.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("") : group.label}
          </span>)}
        </div>
      </div>
    </div>
    <div className={styles.yAxis} aria-hidden="true">
      {ticks.map(tick => <span key={tick} style={{ insetBlockEnd: `${tick / scale * 100}%` }}>{number.format(tick)}</span>)}
    </div>
  </div>;
}
