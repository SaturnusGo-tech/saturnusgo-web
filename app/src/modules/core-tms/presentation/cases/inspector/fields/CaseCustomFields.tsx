import { useEffect, useState } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { useCustomFieldCatalog } from "../../../../custom-fields/state/catalog/useCustomFieldCatalog";
import { CustomFieldPicker } from "../../../../custom-fields/presentation/picker/CustomFieldPicker";
import { customFieldLabel, customValueLabel } from "../../../../custom-fields/application/field-labels";
import { updateCaseField } from "./case-field-selection";
import { InspectorFieldValue } from "../inline/InspectorFieldValue";
import css from "./caseFields.module.css";
export function CaseCustomFields({ projectId = "", revision, editing, canCreate = false, disabled, ru, onPatch, onRequestEdit }: {
  projectId?: string; revision: TestCaseRevision; editing: boolean; canCreate?: boolean; disabled?: boolean; ru: boolean;
  onPatch(value: Partial<TestCaseRevision>): void; onRequestEdit?: () => void;
}) {
  const { workspaceId, offline } = useWorkspacePeople();
  const [activeField, setActiveField] = useState<string | null>(null);
  const catalog = useCustomFieldCatalog(workspaceId, projectId, editing && !offline);
  useEffect(() => { if (!editing) setActiveField(null); }, [editing, workspaceId, projectId]);
  useEffect(() => { if (editing && catalog.cursor && !catalog.pending && !catalog.loading && !catalog.failure) void catalog.more(); },
    [editing, catalog.cursor, catalog.pending, catalog.loading, catalog.failure, catalog.more]);
  const snapshots = revision.customFields ?? [];
  const definitions = editing ? catalog.items : [];
  const canEdit = !disabled && !offline && Boolean(onRequestEdit);
  function begin(fieldId: string) {
    if (!canEdit) return;
    setActiveField(fieldId);
    onRequestEdit?.();
  }
  function readValue(label: string, value: string, fieldId?: string) {
    return <InspectorFieldValue label={label} onEdit={canEdit && fieldId ? () => begin(fieldId) : undefined}>
      {value || (ru ? "Не указано" : "Not specified")}
    </InspectorFieldValue>;
  }
  const hasSystemField = (systemKey: "product" | "regression") => snapshots.some(field => field.systemKey === systemKey)
    || definitions.some(field => field.systemKey === systemKey);
  return <dl className={editing ? `${css.facts} ${css.editing}` : css.facts}>
    {editing && catalog.loading && <div role="status">{ru ? "Загрузка полей…" : "Loading fields…"}</div>}
    {editing && Boolean(catalog.failure) && <div role="alert">{ru ? "Не удалось загрузить поля." : "Could not load fields."} <button type="button" onClick={catalog.refresh}>{ru ? "Повторить" : "Retry"}</button></div>}
    {definitions.map(field => {
      const selected = snapshots.find(item => item.fieldId === field.id)?.values ?? [];
      const label = customFieldLabel(field, ru);
      const active = activeField === null || activeField === field.id || activeField === `system:${field.systemKey}`;
      const text = selected.map(value => customValueLabel(value, ru)).join(", ")
        || (field.systemKey === "regression" ? String(Boolean(revision.regression)) : field.systemKey === "product" ? revision.component : "");
      return <div key={field.id} className={css.field}><dt>{label}{field.required && <b aria-label={ru ? "Обязательное поле" : "Required"}> *</b>}</dt><dd>
        {active ? <CustomFieldPicker workspaceId={workspaceId} projectId={projectId} field={field} selected={selected}
          autoOpen={activeField !== null}
          canCreate={canCreate} disabled={disabled || offline} placeholder={field.systemKey === "regression" ? "false" : undefined}
          parentValueId={field.systemKey === "product" ? revision.productGroupId ?? undefined : undefined}
          onChange={values => onPatch(updateCaseField(revision, field, values))} /> : readValue(label, text, field.id)}
      </dd>
      </div>;
    })}
    {snapshots.filter(field => field.values.length && !definitions.some(item => item.id === field.fieldId)).map(field => {
      const label = customFieldLabel(field, ru);
      return <div key={field.fieldId}><dt>{label}</dt><dd>{readValue(label,
        field.values.map(value => customValueLabel(value, ru)).join(", "), !editing ? field.fieldId : undefined)}</dd></div>;
    })}
    {!hasSystemField("product") && revision.component && <div><dt>{ru ? "Продукт" : "Product"}</dt><dd>{readValue(ru ? "Продукт" : "Product", revision.component, "system:product")}</dd></div>}
    {!hasSystemField("regression") && <div><dt>{ru ? "Регресс" : "Regression"}</dt><dd>{readValue(ru ? "Регресс" : "Regression", String(Boolean(revision.regression)), "system:regression")}</dd></div>}
  </dl>;
}
