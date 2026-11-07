import { useEffect, useId, useRef, useState } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { useCustomFieldCatalog } from "../../../../custom-fields/state/catalog/useCustomFieldCatalog";
import { CustomFieldPicker } from "../../../../custom-fields/presentation/picker/CustomFieldPicker";
import { customFieldLabel, customValueLabel } from "../../../../custom-fields/application/field-labels";
import { updateCaseField } from "./case-field-selection";
import { InspectorFieldValue } from "../inline/InspectorFieldValue";
import css from "./caseFields.module.css";
export function CaseCustomFields({ projectId = "", revision, editing, canCreate = false, disabled, ru, requiredFields, onPatch, onRequestEdit }: {
  projectId?: string; revision: TestCaseRevision; editing: boolean; canCreate?: boolean; disabled?: boolean; ru: boolean;
  requiredFields?: boolean; onPatch(value: Partial<TestCaseRevision>): void; onRequestEdit?: () => void;
}) {
  const { workspaceId, offline } = useWorkspacePeople();
  const [activeField, setActiveField] = useState<string | null>(null);
  const errorId = useId();
  const fieldList = useRef<HTMLDListElement>(null);
  const editFields = useRef<HTMLButtonElement>(null);
  const fallbackError = useRef<HTMLParagraphElement>(null);
  const catalog = useCustomFieldCatalog(workspaceId, projectId, editing && !offline);
  useEffect(() => { if (!editing) setActiveField(null); }, [editing, workspaceId, projectId]);
  useEffect(() => { if (editing && catalog.cursor && !catalog.pending && !catalog.loading && !catalog.failure) void catalog.more(); },
    [editing, catalog.cursor, catalog.pending, catalog.loading, catalog.failure, catalog.more]);
  const snapshots = revision.customFields ?? [];
  const definitions = editing ? catalog.items : [];
  const catalogReady = editing && !catalog.loading && !catalog.cursor;
  const showFallback = requiredFields && (!definitions.some(field => field.required) || Boolean(catalog.failure));
  useEffect(() => {
    if (requiredFields && !disabled) {
      (fieldList.current?.querySelector<HTMLButtonElement>("button[aria-invalid=true]:not(:disabled)")
        ?? editFields.current ?? fallbackError.current)?.focus();
    }
  }, [requiredFields, catalogReady, disabled]);
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
  return <>
    {showFallback && <p ref={fallbackError} tabIndex={-1} role="alert" className={css.error}>
      {ru ? "Выберите значения обязательных полей." : "Choose a value for each required field."}
      {!editing && canEdit && <button ref={editFields} type="button" onClick={onRequestEdit}>
        {ru ? "Изменить поля" : "Edit custom fields"}
      </button>}
    </p>}
    <dl ref={fieldList} className={editing ? `${css.facts} ${css.editing}` : css.facts}>
      {editing && catalog.loading && <div role="status">{ru ? "Загрузка полей…" : "Loading fields…"}</div>}
      {editing && Boolean(catalog.failure) && <div role="alert">{ru ? "Не удалось загрузить поля." : "Could not load fields."} <button type="button" onClick={catalog.refresh}>{ru ? "Повторить" : "Retry"}</button></div>}
      {definitions.map(field => {
        const snapshot = snapshots.find(item => item.fieldId === field.id);
        const selected = snapshot?.values ?? [];
        const legacyProduct = field.systemKey === "product" && !snapshot && Boolean(revision.component.trim());
        const missing = requiredFields && field.required && field.systemKey !== "regression" && !legacyProduct && selected.length === 0;
        const label = customFieldLabel(field, ru);
        const explicitlyActive = activeField === field.id || activeField === `system:${field.systemKey}`;
        const active = activeField === null || explicitlyActive || missing;
        const text = selected.map(value => customValueLabel(value, ru)).join(", ")
          || (field.systemKey === "regression" ? String(Boolean(revision.regression)) : field.systemKey === "product" ? revision.component : "");
        return <div key={field.id} className={css.field}><dt>{label}{field.required && <b aria-label={ru ? "Обязательное поле" : "Required"}> *</b>}</dt><dd>
          {active ? <CustomFieldPicker workspaceId={workspaceId} projectId={projectId} field={field} selected={selected}
            autoOpen={explicitlyActive} invalid={missing} errorId={missing ? `${errorId}-${field.id}` : undefined}
            canCreate={canCreate} disabled={disabled || offline} placeholder={field.systemKey === "regression" ? "false" : undefined}
            parentValueId={field.systemKey === "product" ? revision.productGroupId ?? undefined : undefined}
            onChange={values => onPatch(updateCaseField(revision, field, values))} /> : readValue(label, text, field.id)}
          {missing && <p role="alert" id={`${errorId}-${field.id}`} className={css.error}>
            {ru ? `Выберите значение для поля «${label}».` : `Choose a value for ${label}.`}
          </p>}
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
    </dl>
  </>;
}
