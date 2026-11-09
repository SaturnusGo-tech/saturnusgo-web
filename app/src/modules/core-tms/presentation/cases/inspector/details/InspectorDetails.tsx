import { useEffect, useState, type ReactNode } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { MarkdownField } from "../markdown/MarkdownField";
import { ResponsibleName } from "../../../../workspace/members/presentation/ResponsibleName";
import { CaseAuthor } from "../../../../test-cases/attribution/presentation/CaseAuthor";
import { useMemberName } from "../../../../workspace/members/state/useMemberName";
import { normalizeRevisionTags, revisionTagsAreValid } from "../../../../helpers/cases/caseRevision";
import { PropertyAssigneeField } from "../../../common/properties/metadata/PropertyAssigneeField";
import { PropertyLabelField, PropertyLabelTokens } from "../../../common/properties/metadata/PropertyLabelField";
import { Button, Input } from "@heroui/react";
import { Database, MessageSquareText } from "lucide-react";
import { PropertyValue } from "../../../common/properties/select/PropertySelect";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import rail from "../propertyRail.module.css";

type Field = "testData" | "ownerIdentityId" | "tags" | "changeNote";
type Props = {
  testCaseId?: string; revision: TestCaseRevision; editing: boolean; autoFocus?: boolean;
  disabled?: boolean; ru: boolean; onPatch: (next: Partial<TestCaseRevision>) => void;
  onRequestEdit?: () => void;
  documentation?: ReactNode;
  tagSuggestions?: readonly string[];
};

export function InspectorDetails({ revision, editing, autoFocus = true, disabled, ru, onPatch, testCaseId, onRequestEdit, documentation, tagSuggestions }: Props) {
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
  const labels = {
    testData: ru ? "Тестовые данные" : "Test data",
    revisionAuthor: ru ? "Автор ревизии" : "Revision author",
    tags: ru ? "Теги" : "Tags",
    note: ru ? "Комментарий к ревизии" : "Revision note",
    notePlaceholder: ru ? "Комментарий" : "Revision note",
  };
  const active = (field: Field) => editing && (activeField === null || activeField === field);
  const request = (field: Field) => !disabled && onRequestEdit ? () => { setActiveField(field); onRequestEdit(); } : undefined;
  const focus = (field: Field) => autoFocus && (activeField === field || (activeField === null && field === "testData"));
  const hasTestData = Boolean(revision.testData.trim());
  const editTestData = request("testData");
  const noteIcon = <MessageSquareText size={15} aria-hidden="true" />;
  return <div className={rail.detailsBody}>
    <div className={rail.rows}>
      <div className={rail.owner}><PropertyAssigneeField workspaceId={workspaceId} locale={locale} includeAgents profilePreview
        offline={offline} disabled={disabled} autoOpen={activeField === "ownerIdentityId"} value={assignee}
        onRequestEdit={!offline ? request("ownerIdentityId") : undefined}
        onChange={active("ownerIdentityId") ? (next) => {
          setChosen(next); onPatch({ ownerIdentityId: next?.identityId ?? null });
        } : undefined} /></div>
      {revision.createdBy && <ResponsibleName workspaceId={workspaceId} offline={offline} identityId={revision.createdBy} profileLabel={labels.revisionAuthor} />}
      {testCaseId && <CaseAuthor caseId={testCaseId} />}
      {(active("testData") || hasTestData) ? <div className={rail.testData}>
        {editTestData && !active("testData")
          ? <Button type="button" isIconOnly variant="light" className={rail.dataIcon} aria-label={labels.testData}
            title={labels.testData} onPress={editTestData}><Database size={15} aria-hidden="true" /></Button>
          : <Database size={15} className={rail.dataIcon} aria-hidden="true" />}
        <div className={rail.additionalInput}>
          <MarkdownField appearance="plain" attachmentKey="test-data" compact value={revision.testData} label={labels.testData}
            emptyLabel={labels.testData} autoFocus={focus("testData")} onRequestEdit={editTestData}
            onChange={active("testData") ? (testData) => onPatch({ testData }) : undefined} />
        </div>
      </div> : editTestData && <PropertyValue label={labels.testData} onEdit={editTestData}>
        <Database size={15} aria-hidden="true" /><span className={rail.placeholder}>{labels.testData}</span>
      </PropertyValue>}
      {active("changeNote") ? <div className={rail.noteRow}>
        {noteIcon}
        <Input classNames={{ inputWrapper: rail.noteWrapper, input: rail.noteInput }} aria-label={labels.note}
          placeholder={labels.notePlaceholder} size="sm" isDisabled={disabled} autoFocus={focus("changeNote")} value={revision.changeNote}
          onValueChange={(changeNote) => onPatch({ changeNote })} />
      </div> : (revision.changeNote || request("changeNote")) && <PropertyValue label={labels.note} onEdit={request("changeNote")}>
        {noteIcon}<span className={revision.changeNote ? undefined : rail.placeholder} title={revision.changeNote || undefined}>
          {revision.changeNote || labels.notePlaceholder}
        </span>
      </PropertyValue>}
    </div>
    {documentation && <dl className={rail.documentation}>{documentation}</dl>}
    {(revision.tags.length > 0 || active("tags") || request("tags")) && <section className={rail.tags} aria-label={labels.tags}>
      <h4>{labels.tags}</h4>
      <PropertyLabelTokens locale={locale} labels={revision.tags} tag />
      {(active("tags") || request("tags")) && <PropertyLabelField locale={locale} tag labels={revision.tags}
        suggestions={tagSuggestions} disabled={disabled} autoOpen={activeField === "tags"} maxCount={100} maxLength={64}
        isValid={(tag) => revisionTagsAreValid([tag])} onRequestEdit={request("tags")}
        onAdd={active("tags") ? (tag) => onPatch({ tags: normalizeRevisionTags([...revision.tags, tag]) }) : undefined}
        onRemove={active("tags") ? (tag) => onPatch({ tags: revision.tags.filter((value) => value !== tag) }) : undefined} />}
    </section>}
  </div>;
}
