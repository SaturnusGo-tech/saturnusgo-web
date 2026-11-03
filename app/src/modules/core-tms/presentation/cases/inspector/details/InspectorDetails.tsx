import { useEffect, useState } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { MarkdownField } from "../markdown/MarkdownField";
import { ResponsibleName } from "../../../../workspace/members/presentation/ResponsibleName";
import { CaseAuthor } from "../../../../test-cases/attribution/presentation/CaseAuthor";
import { ResponsiblePicker } from "../../../../workspace/members/presentation/ResponsiblePicker";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { InspectorFieldValue } from "../inline/InspectorFieldValue";
import inline from "../inline/inlineField.module.css";
import css from "../caseInspector.module.css";

type Field = "testData" | "ownerIdentityId" | "tags" | "changeNote";
type Props = {
  testCaseId?: string; revision: TestCaseRevision; editing: boolean; autoFocus?: boolean;
  disabled?: boolean; ru: boolean; onPatch: (next: Partial<TestCaseRevision>) => void;
  onRequestEdit?: () => void;
};

export function InspectorDetails({ revision, editing, autoFocus = true, disabled, ru, onPatch, testCaseId, onRequestEdit }: Props) {
  const { workspaceId, offline } = useWorkspacePeople();
  const [activeField, setActiveField] = useState<Field | null>(null);
  useEffect(() => { if (!editing) setActiveField(null); }, [editing]);
  const labels = { testData: ru ? "Тестовые данные" : "Test data", owner: ru ? "Ответственный" : "Responsible",
    tags: ru ? "Теги" : "Tags", note: ru ? "Комментарий к ревизии" : "Revision note", empty: ru ? "Не указано" : "Not specified" };
  const active = (field: Field) => editing && (activeField === null || activeField === field);
  const request = (field: Field) => !disabled && onRequestEdit ? () => { setActiveField(field); onRequestEdit(); } : undefined;
  const focus = (field: Field) => autoFocus && (activeField === field || (activeField === null && field === "testData"));
  return <dl className={css.compactSummary}>
    <div className={css.wideField}>
      <dt>{request("testData") ? <button type="button" className={inline.label} onClick={request("testData")}>{labels.testData}</button> : labels.testData}</dt>
      <dd className={active("testData") ? `${css.borderedMarkdown} ${css.additionalInput}` : undefined}>
        <MarkdownField appearance="plain" attachmentKey="test-data" compact value={revision.testData} label={labels.testData}
          emptyLabel={labels.empty} autoFocus={focus("testData")} onRequestEdit={request("testData")}
          onChange={active("testData") ? (testData) => onPatch({ testData }) : undefined} />
      </dd>
    </div>
    <div><dt>{labels.owner}</dt><dd>{active("ownerIdentityId")
      ? <ResponsiblePicker workspaceId={workspaceId} offline={offline} disabled={disabled} autoOpen={activeField === "ownerIdentityId"}
          value={revision.ownerIdentityId} onChange={(ownerIdentityId) => onPatch({ ownerIdentityId })} />
      : <InspectorFieldValue label={labels.owner} onEdit={request("ownerIdentityId")}><ResponsibleName workspaceId={workspaceId} offline={offline} identityId={revision.ownerIdentityId} /></InspectorFieldValue>}</dd></div>
    <div><dt>{ru ? "Автор ревизии" : "Revision author"}</dt><dd><ResponsibleName workspaceId={workspaceId} offline={offline} identityId={revision.createdBy || null} /></dd></div>
    {testCaseId && <CaseAuthor caseId={testCaseId} />}
    <div><dt>{labels.tags}</dt><dd>{active("tags")
      ? <input className={inline.input} aria-label={labels.tags} disabled={disabled} autoFocus={focus("tags")} value={revision.tags.join(", ")}
          onChange={(event) => onPatch({ tags: event.target.value.split(",").map((tag) => tag.trim()) })} />
      : <InspectorFieldValue label={labels.tags} onEdit={request("tags")}>{revision.tags.join(", ") || labels.empty}</InspectorFieldValue>}</dd></div>
    <div><dt>{labels.note}</dt><dd>{active("changeNote")
      ? <input className={inline.input} aria-label={labels.note} disabled={disabled} autoFocus={focus("changeNote")} value={revision.changeNote}
          onChange={(event) => onPatch({ changeNote: event.target.value })} />
      : <InspectorFieldValue label={labels.note} onEdit={request("changeNote")}>{revision.changeNote || labels.empty}</InspectorFieldValue>}</dd></div>
  </dl>;
}
