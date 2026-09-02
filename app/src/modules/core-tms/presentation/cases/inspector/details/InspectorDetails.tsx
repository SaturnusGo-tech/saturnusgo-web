import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { MarkdownField } from "../markdown/MarkdownField";
import css from "../caseInspector.module.css";

type Props = {
  revision: TestCaseRevision;
  editing: boolean;
  autoFocus?: boolean;
  ru: boolean;
  onPatch: (next: Partial<TestCaseRevision>) => void;
};

export function InspectorDetails({ revision, editing, autoFocus = true, ru, onPatch }: Props) {
  const labels = {
    testData: ru ? "Тестовые данные" : "Test data",
    owner: ru ? "Ответственный" : "Owner identity",
    tags: ru ? "Теги" : "Tags",
    note: ru ? "Комментарий к ревизии" : "Revision note",
    empty: ru ? "Не указано" : "Not specified",
  };
  if (editing) return <div className={css.compactFields}>
    <div className={`${css.wideField} ${css.markdownControl}`}><span>{labels.testData}</span><MarkdownField attachmentKey="test-data" compact autoFocus={autoFocus} label={labels.testData} value={revision.testData} onChange={(testData) => onPatch({ testData })} /></div>
    <label><span>{labels.owner}</span><input value={revision.ownerIdentityId ?? ""} onChange={(event) => onPatch({ ownerIdentityId: event.target.value.trim() || null })} /></label>
    <label><span>{labels.tags}</span><input value={revision.tags.join(", ")} onChange={(event) => onPatch({ tags: event.target.value.split(",").map((tag) => tag.trim()) })} /></label>
    <label><span>{labels.note}</span><input value={revision.changeNote} onChange={(event) => onPatch({ changeNote: event.target.value })} /></label>
  </div>;
  const rows = [
    [labels.owner, revision.ownerIdentityId ?? ""],
    [labels.tags, revision.tags.join(", ")],
    [labels.note, revision.changeNote],
  ];
  return <dl className={css.compactSummary}>
    <div className={css.wideField}><dt>{labels.testData}</dt><dd><MarkdownField value={revision.testData} label={labels.testData} emptyLabel={labels.empty} /></dd></div>
    {rows.map(([label, value]) => <div key={label}>
    <dt>{label}</dt><dd>{value || labels.empty}</dd>
    </div>)}
  </dl>;
}
