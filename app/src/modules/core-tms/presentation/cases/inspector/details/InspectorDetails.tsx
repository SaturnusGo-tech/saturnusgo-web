import { useEffect, useState, type ReactNode } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { CaseAuthor } from "../../../../test-cases/attribution/presentation/CaseAuthor";
import { useMemberName } from "../../../../workspace/members/state/useMemberName";
import { normalizeRevisionTags, revisionTagsAreValid } from "../../../../helpers/cases/caseRevision";
import { PropertyAssigneeField } from "../../../common/properties/metadata/PropertyAssigneeField";
import { PropertyLabelField, PropertyLabelTokens } from "../../../common/properties/metadata/PropertyLabelField";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import rail from "../propertyRail.module.css";

type Field = "ownerIdentityId" | "tags";
type Props = {
  testCaseId?: string; revision: TestCaseRevision; editing: boolean;
  disabled?: boolean; ru: boolean; creating?: boolean; onPatch: (next: Partial<TestCaseRevision>) => void;
  onRequestEdit?: () => void;
  documentation?: ReactNode;
  tagSuggestions?: readonly string[];
};

export function InspectorDetails({ revision, editing, disabled, ru, creating, onPatch, testCaseId, onRequestEdit, documentation, tagSuggestions }: Props) {
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
  const tagsLabel = ru ? "Теги" : "Tags";
  const active = (field: Field) => editing && (activeField === null || activeField === field);
  const request = (field: Field) => !disabled && onRequestEdit ? () => { setActiveField(field); onRequestEdit(); } : undefined;
  return <div className={rail.detailsBody}>
    <div className={rail.rows}>
      <div className={creating ? rail.creationOwner : rail.owner}><PropertyAssigneeField workspaceId={workspaceId} locale={locale} includeAgents
        offline={offline} disabled={disabled} autoOpen={activeField === "ownerIdentityId"} value={assignee}
        onRequestEdit={!offline ? request("ownerIdentityId") : undefined}
        onChange={active("ownerIdentityId") ? (next) => {
          setChosen(next); onPatch({ ownerIdentityId: next?.identityId ?? null });
        } : undefined} /></div>
      {testCaseId && <CaseAuthor caseId={testCaseId} />}
    </div>
    {documentation && <dl className={rail.documentation}>{documentation}</dl>}
    {(revision.tags.length > 0 || active("tags") || request("tags")) && <section className={rail.tags} aria-label={tagsLabel}>
      <h4>{tagsLabel}</h4>
      <PropertyLabelTokens locale={locale} labels={revision.tags} tag />
      {(active("tags") || request("tags")) && <PropertyLabelField locale={locale} tag labels={revision.tags}
        suggestions={tagSuggestions} disabled={disabled} autoOpen={activeField === "tags"} maxCount={100} maxLength={64}
        isValid={(tag) => revisionTagsAreValid([tag])} onRequestEdit={request("tags")}
        onAdd={active("tags") ? (tag) => onPatch({ tags: normalizeRevisionTags([...revision.tags, tag]) }) : undefined}
        onRemove={active("tags") ? (tag) => onPatch({ tags: revision.tags.filter((value) => value !== tag) }) : undefined} />}
    </section>}
  </div>;
}
