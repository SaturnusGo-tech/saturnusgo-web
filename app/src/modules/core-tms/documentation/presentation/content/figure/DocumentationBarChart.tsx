import type { DocBlock } from "../../../model/article";
import styles from "./bar-chart.module.css";

export function DocumentationBarChart({ block }: { block: Extract<DocBlock, { kind: "bar-chart" }> }) {
  const ticks = Array.from({ length: 5 }, (_, index) => block.maximum * index / 4);
  return <figure className={styles.figure}>
    <figcaption className={styles.caption}>
      <strong>{block.title}</strong><span>{block.summary}</span>
    </figcaption>
    <div className={styles.plot}>
      <ul className={styles.bars}>
        {block.bars.map(({ label, value, tone }) => <li key={label} className={styles.row}>
          <span>{label}</span>
          <span className={styles.track} aria-hidden="true"><span className={styles.fill} data-tone={tone}
            style={{ width: `${value / block.maximum * 100}%` }} /></span>
          <strong>{value}</strong>
        </li>)}
      </ul>
      <div className={styles.axis} aria-hidden="true"><div>{ticks.map(tick => <span key={tick}>{tick}</span>)}</div></div>
    </div>
  </figure>;
}
