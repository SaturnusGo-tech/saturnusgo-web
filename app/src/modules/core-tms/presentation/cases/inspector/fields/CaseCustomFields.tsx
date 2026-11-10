import { ErrorToast } from "../../../common/error/ErrorToast";
import { useEffect, useId, useRef, useState } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { useCustomFieldCatalog } from "../../../../custom-fields/state/catalog/useCustomFieldCatalog";
import { CustomFieldIcon, CustomFieldPicker } from "../../../../custom-fields/presentation/picker/CustomFieldPicker";
import type { CustomFieldDefinition, CustomFieldSystemKey } from "../../../../custom-fields/model/custom-field";
import { customFieldLabel, customValueLabel } from "../../../../custom-fields/application/field-labels";
import { updateCaseField } from "./case-field-selection";
import { PropertyValue } from "../../../common/properties/select/PropertySelect";
import rail from "../propertyRail.module.css";
import css from "./caseFields.module.css";

type FieldSnapshot = NonNullable<TestCaseRevision["customFields"]>[number];
type LegacyField = "product" | "regression";
type FieldRow = { key: string; definition?: CustomFieldDefinition; snapshot?: FieldSnapshot; legacy?: LegacyField };
type InlineEdit = { key: string; order: readonly string[] };

function rowKey(fieldId: string, systemKey?: CustomFieldSystemKey | null) {
  return systemKey === "product" || systemKey === "regression" ? `system:${systemKey}` : fieldId;
}

function fieldRows(revision: TestCaseRevision, definitions: readonly CustomFieldDefinition[], inlineEdit: InlineEdit | null, creating: boolean, requiredFields?: boolean) {
  const snapshots = revision.customFields ?? [];
  const byId = new Map(definitions.map(definition => [definition.id, definition]));
  const order = inlineEdit?.order ?? (creating ? definitions.map(field => rowKey(field.id, field.systemKey)) : []);
  const position = new Map(order.map((key, index) => [key, index]));
  const rows: FieldRow[] = [];
  for (const snapshot of snapshots) {
    const key = rowKey(snapshot.fieldId, snapshot.systemKey);
    if (snapshot.values.length || position.has(key)) rows.push({ key, snapshot, definition: byId.get(snapshot.fieldId) });
  }
  for (const legacy of ["product", "regression"] as const) {
    if (snapshots.some(snapshot => snapshot.systemKey === legacy) || (legacy === "product" && !revision.component)) continue;
    rows.push({ key: `system:${legacy}`, legacy, definition: definitions.find(definition => definition.systemKey === legacy) });
  }
  const visible = new Set(rows.flatMap(row => row.definition ? [row.definition.id] : []));
  for (const definition of definitions) {
    const key = rowKey(definition.id, definition.systemKey);
    if (visible.has(definition.id) || (inlineEdit && !position.has(key) && !(requiredFields && definition.required))) continue;
    rows.push({ key, definition, snapshot: snapshots.find(snapshot => snapshot.fieldId === definition.id) });
  }
  return position.size ? rows.sort((a, b) => (position.get(a.key) ?? order.length) - (position.get(b.key) ?? order.length)) : rows;
}

export function CaseCustomFields({ projectId = "", revision, editing, creating = false, canCreate = false, disabled, ru, requiredFields, onPatch, onRequestEdit }: {
  projectId?: string; revision: TestCaseRevision; editing: boolean; creating?: boolean; canCreate?: boolean; disabled?: boolean; ru: boolean;
  requiredFields?: boolean; onPatch(value: Partial<TestCaseRevision>): void; onRequestEdit?: () => void;
}) {
  const { workspaceId, offline } = useWorkspacePeople();
  const [inlineEdit, setInlineEdit] = useState<InlineEdit | null>(null);
  const errorId = useId();
  const fieldList = useRef<HTMLDListElement>(null);
  const editFields = useRef<HTMLButtonElement>(null);
  const fallbackError = useRef<HTMLParagraphElement>(null);
  const showAvailable = Boolean(projectId && onRequestEdit) && !offline;
  const useCatalog = !offline && (editing || showAvailable);
  const catalog = useCustomFieldCatalog(workspaceId, projectId, useCatalog);
  useEffect(() => { if (!editing) setInlineEdit(null); }, [editing, workspaceId, projectId]);
  useEffect(() => { if (useCatalog && catalog.cursor && !catalog.pending && !catalog.loading && !catalog.failure) void catalog.more(); },
    [useCatalog, catalog.cursor, catalog.pending, catalog.loading, catalog.failure, catalog.more]);
  const definitions = useCatalog ? catalog.items : [];
  const rows = fieldRows(revision, definitions, editing ? inlineEdit : null, creating, requiredFields);
  const catalogReady = editing && !catalog.loading && !catalog.cursor;
  const showFallback = requiredFields && (!definitions.some(field => field.required) || Boolean(catalog.failure));
  useEffect(() => {
    if (requiredFields && !disabled) {
      (fieldList.current?.querySelector<HTMLButtonElement>("button[aria-invalid=true]:not(:disabled)")
        ?? editFields.current ?? fallbackError.current)?.focus();
    }
  }, [requiredFields, catalogReady, disabled]);
  const canEdit = !disabled && !offline && Boolean(onRequestEdit);
  function begin(key: string) {
    if (!canEdit) return;
    setInlineEdit(previous => ({ key, order: previous?.order ?? rows.map(row => row.key) }));
    onRequestEdit?.();
  }
  function readValue(label: string, value: string, systemKey: CustomFieldSystemKey | null | undefined, key?: string) {
    return <PropertyValue label={label} onEdit={canEdit && key ? () => begin(key) : undefined}>
      <CustomFieldIcon systemKey={systemKey ?? null} fallback /><span>{value}</span>
    </PropertyValue>;
  }
  return <>
    <dl ref={fieldList} className={`${rail.rows} ${css.facts}`}>
      {rows.map(({ key, definition: field, snapshot, legacy }) => {
        const systemKey = field?.systemKey ?? snapshot?.systemKey ?? legacy;
        const selected = snapshot?.values ?? [];
        const product = systemKey === "product" && !snapshot ? revision.component : "";
        const placeholder = systemKey === "regression" ? String(Boolean(revision.regression)) : product || undefined;
        const missing = requiredFields && field?.required && systemKey !== "regression" && !product.trim() && selected.length === 0;
        const label = customFieldLabel(field ?? snapshot ?? { name: legacy === "product" ? "Product" : "Regression", systemKey: legacy ?? null }, ru);
        const explicitlyActive = inlineEdit?.key === key;
        const active = !inlineEdit || explicitlyActive || missing;
        const validationId = missing ? `${errorId}-${key}` : undefined;
        const stored = selected.map(value => customValueLabel(value, ru)).join(", ") || placeholder;
        const text = systemKey === "regression"
          ? stored === "true" ? label : (ru ? "Без регресса" : "No regression")
          : !stored ? label : systemKey ? stored : `${label}: ${stored}`;
        const display = field?.required && !stored ? `${text} *` : text;
        return <div key={key} className={css.field}><dt className={css.visuallyHidden}>{label}{field?.required && <b aria-label={ru ? "Обязательное поле" : "Required"}> *</b>}</dt><dd>
          {editing && field && active ? <CustomFieldPicker workspaceId={workspaceId} projectId={projectId} field={field} selected={selected}
            autoOpen={explicitlyActive} invalid={missing} errorId={validationId}
            canCreate={canCreate} disabled={disabled || offline} placeholder={placeholder} displayValue={display}
            parentValueId={systemKey === "product" ? revision.productGroupId ?? undefined : undefined}
            onChange={values => onPatch(updateCaseField(revision, field, values))} /> : readValue(label, display, systemKey, !editing || field || catalog.loading ? key : undefined)}
          {missing && <p role="alert" id={validationId} className={css.error}>
            {ru ? `Выберите значение для поля «${label}».` : `Choose a value for ${label}.`}
          </p>}
        </dd>
        </div>;
      })}
    </dl>
    {editing && catalog.loading && <p role="status" className={css.loading}>{ru ? "Загрузка полей…" : "Loading fields…"}</p>}
    <ErrorToast message={useCatalog && catalog.failure ? (ru ? "Не удалось загрузить поля." : "Could not load fields.") : null}
      retryLabel={ru ? "Повторить" : "Retry"} onRetry={catalog.refresh} />
    {showFallback && <p ref={fallbackError} tabIndex={-1} role="alert" className={css.error}>
      {ru ? "Выберите значения обязательных полей." : "Choose a value for each required field."}
      {!editing && canEdit && <button ref={editFields} type="button" onClick={onRequestEdit}>
        {ru ? "Изменить поля" : "Edit custom fields"}
      </button>}
    </p>}
  </>;
}
