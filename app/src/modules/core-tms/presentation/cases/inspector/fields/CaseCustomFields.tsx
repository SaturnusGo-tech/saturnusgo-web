import { useEffect } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { useCustomFieldCatalog } from "../../../../custom-fields/state/catalog/useCustomFieldCatalog";
import { CustomFieldPicker } from "../../../../custom-fields/presentation/picker/CustomFieldPicker";
import { customFieldLabel, customValueLabel } from "../../../../custom-fields/application/field-labels";
import { updateCaseField } from "./case-field-selection";
import css from "./caseFields.module.css";
export function CaseCustomFields({ projectId = "", revision, editing, canCreate = false, disabled, ru, onPatch }: {
  projectId?: string; revision: TestCaseRevision; editing: boolean; canCreate?: boolean; disabled?: boolean; ru: boolean;
  onPatch(value: Partial<TestCaseRevision>): void;
}) {
  const { workspaceId, offline } = useWorkspacePeople();
  const catalog = useCustomFieldCatalog(workspaceId, projectId, editing && !offline);
  useEffect(() => { if (editing && catalog.cursor && !catalog.pending && !catalog.loading && !catalog.failure) void catalog.more(); },
    [editing, catalog.cursor, catalog.pending, catalog.loading, catalog.failure, catalog.more]);
  const snapshots = revision.customFields ?? [];
  if (!editing) return <dl className={css.facts}>
    {snapshots.filter(field => field.values.length).map(field => <div key={field.fieldId}>
      <dt>{customFieldLabel(field, ru)}</dt><dd>{field.values.map(value => customValueLabel(value, ru)).join(", ")}</dd>
    </div>)}
    {!snapshots.some(field => field.systemKey === "product") && revision.component && <div><dt>{ru ? "Продукт" : "Product"}</dt><dd>{revision.component}</dd></div>}
    {!snapshots.some(field => field.systemKey === "regression") && <div><dt>{ru ? "Регресс" : "Regression"}</dt><dd>{revision.regression ? "true" : "false"}</dd></div>}
  </dl>;
  return <div className={css.fields}>
    {catalog.loading && <span role="status">{ru ? "Загрузка полей…" : "Loading fields…"}</span>}
    {Boolean(catalog.failure) && <p role="alert">{ru ? "Не удалось загрузить поля." : "Could not load fields."} <button type="button" onClick={catalog.refresh}>{ru ? "Повторить" : "Retry"}</button></p>}
    {catalog.items.map(field => {
      const selected = snapshots.find(item => item.fieldId === field.id)?.values ?? [];
      return <div key={field.id} className={css.field}><span>{customFieldLabel(field, ru)}{field.required && <b aria-label={ru ? "Обязательное поле" : "Required"}> *</b>}</span>
        <CustomFieldPicker workspaceId={workspaceId} projectId={projectId} field={field} selected={selected}
          canCreate={canCreate} disabled={disabled || offline} placeholder={field.systemKey === "regression" ? "false" : undefined}
          parentValueId={field.systemKey === "product" ? revision.productGroupId ?? undefined : undefined}
          onChange={values => onPatch(updateCaseField(revision, field, values))} />
      </div>;
    })}
  </div>;
}
