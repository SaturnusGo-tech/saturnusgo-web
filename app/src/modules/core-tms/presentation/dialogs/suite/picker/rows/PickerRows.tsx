import type { TestCaseSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import styles from "../suite-picker.module.css";

export function priorityLabel(priority: TestCaseSummary["priority"], ru: boolean) {
  const copy = { low: ["Низкий", "Low"], medium: ["Средний", "Medium"], high: ["Высокий", "High"], critical: ["Критический", "Critical"] };
  return copy[priority]?.[ru ? 0 : 1] ?? priority;
}

export function PickerRows({ cases, selected, ru, readonly: readOnly, onToggle }: {
  cases: readonly TestCaseSummary[]; selected: ReadonlySet<string>; ru: boolean; readonly?: boolean; onToggle: (id: string) => void;
}) {
  return <div className={styles.rows}>{cases.map(item => {
    const content = <>
      {!readOnly && <input type="checkbox" checked={selected.has(item.id)} onChange={() => onToggle(item.id)}
        aria-label={`${ru ? "Выбрать" : "Select"} ${item.key}: ${item.title}`} />}
      <span className={styles.caseCopy}><span className={styles.caseTitle}>{item.title}</span>
        <span className={styles.caseMeta}><span>{item.key}</span><span aria-hidden="true">·</span>
          <span className={styles.caseFolder} title={item.folderPath}>{item.folderPath === "/" ? (ru ? "Без папки" : "Unfiled") : item.folderPath}</span>
        </span>
      </span>
      <span className={styles.priority} data-priority={item.priority}><i aria-hidden="true" />{priorityLabel(item.priority, ru)}</span>
    </>;
    return readOnly ? <div className={styles.caseRow} key={item.id}>{content}</div>
      : <label className={styles.caseRow} key={item.id} data-selected={selected.has(item.id) || undefined}>{content}</label>;
  })}</div>;
}
