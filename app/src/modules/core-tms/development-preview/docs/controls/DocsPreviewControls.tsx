import type { ProductDocSelection } from "../../../product-docs/domain/product-docs";
import { readingRoles, type ReadingRole } from "../fixtures/reading-access";
import styles from "../docs-reading-preview.module.css";

export function DocsPreviewControls({ role, onRole, ru, onLocale, dark, onTheme, onSelect, onReset, onConflict, notice }: {
  role: ReadingRole; onRole(role: ReadingRole): void; ru: boolean; onLocale(): void; dark: boolean; onTheme(): void;
  onSelect(selection: ProductDocSelection): void; onReset(): void; onConflict(): void; notice: string;
}) {
  return <nav className={styles.controls} aria-label="Local preview controls">
    <span>{ru ? "Локальная проверка · данные в памяти" : "Local preview · memory only"}</span>
    <label>Role <select aria-label="Preview role" value={role} onChange={event => {
      const next = readingRoles.find(value => value === event.target.value); if (next) onRole(next);
    }}>{readingRoles.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    <button onClick={onLocale}>{ru ? "English" : "Русский"}</button>
    <button onClick={onTheme}>{dark ? "Light" : "Dark"}</button>
    <button onClick={() => onSelect({ docId: "calendar" })}>{ru ? "Опубликованная" : "Published"}</button>
    <button onClick={() => onSelect({ docId: "section" })}>{ru ? "Раздел" : "Section"}</button>
    <button onClick={() => onSelect({ docId: "untitled" })}>Untitled</button>
    <button onClick={() => onSelect({ docId: "calendar", version: 1 })}>{ru ? "История v1" : "History v1"}</button>
    <button onClick={onConflict}>{ru ? "Следующее действие: конфликт" : "Next command: stale"}</button>
    <button onClick={onReset}>{ru ? "Сбросить" : "Reset"}</button>
    <span role="status">{notice || " "}</span>
  </nav>;
}
