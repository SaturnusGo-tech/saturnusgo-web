import { useEffect, useState, type ReactNode } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { MarkdownField } from "../markdown/MarkdownField";
import { ResponsibleName } from "../../../../workspace/members/presentation/ResponsibleName";
import { CaseAuthor } from "../../../../test-cases/attribution/presentation/CaseAuthor";
import { useMemberName } from "../../../../workspace/members/state/useMemberName";
import { normalizeRevisionTags, revisionTagsAreValid } from "../../../../helpers/cases/caseRevision";
import { PropertyAssigneeField } from "../../../common/properties/metadata/PropertyAssigneeField";
import { PropertyLabelField, PropertyLabelTokens } from "../../../common/properties/metadata/PropertyLabelField";
import { Input } from "@heroui/react";
import { Tag } from "lucide-react";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { InspectorFieldValue } from "../inline/InspectorFieldValue";
import inline from "../inline/inlineField.module.css";
import css from "../caseInspector.module.css";
import rail from "../propertyRail.module.css";

type Field = "testData" | "ownerIdentityId" | "tags" | "changeNote";
type Props = {
  testCaseId?: string; revision: TestCaseRevision; editing: boolean; autoFocus?: boolean;
  disabled?: boolean; ru: boolean; onPatch: (next: Partial<TestCaseRevision>) => void;
  onRequestEdit?: () => void;
  documentation?: ReactNode;
};

export function InspectorDetails({ revision, editing, autoFocus = true, disabled, ru, onPatch, testCaseId, onRequestEdit, documentation }: Props) {
  const { workspaceId, offline } = useWorkspacePeople();
  const locale = ru ? "ru" : "en";
  const member = useMemberName(workspaceId, revision.ownerIdentityId, offline);
  const [chosen, setChosen] = useState<{ identityId: string; displayName: string } | null>(null);
  const assignee = revision.ownerIdentityId ? {
    identityId: revision.ownerIdentityId,
    displayName: member.name ?? (chosen?.identityId === revision.ownerIdentityId ? chosen.displayName
      : member.loading ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Участник недоступен" : "Member unavailable")),
  } : null;
  const [activeField, setActiveField] = useState<Field | null>(null);
  useEffect(() => { if (!editing) setActiveField(null); }, [editing]);
  const labels = { testData: ru ? "Тестовые данные" : "Test data", owner: ru ? "Ответственный" : "Responsible",
    tags: ru ? "Теги" : "Tags", note: ru ? "Комментарий к ревизии" : "Revision note", empty: ru ? "Не указано" : "Not specified" };
  const active = (field: Field) => editing && (activeField === null || activeField === field);
  const request = (field: Field) => !disabled && onRequestEdit ? () => { setActiveField(field); onRequestEdit(); } : undefined;
  const focus = (field: Field) => autoFocus && (activeField === field || (activeField === null && field === "testData"));
  return <dl className={`${css.compactSummary} ${rail.readRows} ${rail.additionalRows}`}>
    <div className={`${css.wideField} ${rail.wideRow}`}>
      <dt>{request("testData") ? <button type="button" className={inline.label} onClick={request("testData")}>{labels.testData}</button> : labels.testData}</dt>
      <dd className={rail.additionalInput}>
        <MarkdownField appearance="plain" attachmentKey="test-data" compact value={revision.testData} label={labels.testData}
          emptyLabel={labels.empty} autoFocus={focus("testData")} onRequestEdit={request("testData")}
          onChange={active("testData") ? (testData) => onPatch({ testData }) : undefined} />
      </dd>
    </div>
    <div><dt>{labels.owner}</dt><dd><PropertyAssigneeField workspaceId={workspaceId} locale={locale} includeAgents
      offline={offline} disabled={disabled} autoOpen={activeField === "ownerIdentityId"} value={assignee}
      onRequestEdit={!offline ? request("ownerIdentityId") : undefined}
      onChange={active("ownerIdentityId") ? (next) => {
        setChosen(next); onPatch({ ownerIdentityId: next?.identityId ?? null });
      } : undefined} /></dd></div>
    <div><dt>{ru ? "Автор ревизии" : "Revision author"}</dt><dd><ResponsibleName workspaceId={workspaceId} offline={offline} identityId={revision.createdBy || null} /></dd></div>
    {testCaseId && <CaseAuthor caseId={testCaseId} />}
    <div><dt>{labels.tags}</dt><dd><PropertyLabelField locale={locale} tag labels={revision.tags}
      disabled={disabled} autoOpen={activeField === "tags"} maxCount={100} maxLength={64}
      isValid={(tag) => revisionTagsAreValid([tag])}
      displayValue={revision.tags.length ? <PropertyLabelTokens locale={locale} labels={revision.tags} tag />
        : <><Tag size={15} aria-hidden="true" /><span>{active("tags") ? (ru ? "Добавить тег" : "Add tag") : labels.empty}</span></>}
      onRequestEdit={request("tags")}
      onAdd={active("tags") ? (tag) => onPatch({ tags: normalizeRevisionTags([...revision.tags, tag]) }) : undefined}
      onRemove={active("tags") ? (tag) => onPatch({ tags: revision.tags.filter((value) => value !== tag) }) : undefined} /></dd></div>
    {documentation}
    <div><dt>{labels.note}</dt><dd>{active("changeNote")
      ? <Input classNames={{ inputWrapper: rail.noteWrapper, input: rail.noteInput }} aria-label={labels.note}
          size="sm" isDisabled={disabled} autoFocus={focus("changeNote")} value={revision.changeNote}
          onValueChange={(changeNote) => onPatch({ changeNote })} />
      : <InspectorFieldValue label={labels.note} onEdit={request("changeNote")}>{revision.changeNote || labels.empty}</InspectorFieldValue>}</dd></div>
  </dl>;
}
