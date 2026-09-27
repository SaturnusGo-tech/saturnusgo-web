import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { customFieldError } from "../../application/field-errors";
import { customFieldLabel } from "../../application/field-labels";
import type { CustomFieldDefinition, CustomFieldScope } from "../../model/custom-field";
import { useCustomFieldCatalog } from "../../state/catalog/useCustomFieldCatalog";
import { useCustomFieldWrite } from "../../state/catalog/useCustomFieldWrite";
import { FieldRowMenu } from "../shared/FieldRowMenu";
import { FieldToggle } from "../shared/FieldToggle";
import { CustomFieldEditor } from "../editor/CustomFieldEditor";
import css from "../shared/customFields.module.css";
export function CustomFieldsPage({ workspaceId, projectId, canManageFields, canManageValues, connected }: CustomFieldScope & {
  canManageFields: boolean; canManageValues: boolean; connected: boolean;
}) {
  const { locale, languageTag } = useTmsLocale(); const ru = locale === "ru"; const scope = { workspaceId, projectId };
  const page = useCustomFieldCatalog(workspaceId, projectId, connected); const write = useCustomFieldWrite(scope, ru);
  const [editing, setEditing] = useState<CustomFieldDefinition | "new" | null>(null);
  const manageable = connected && canManageFields;
  async function required(field: CustomFieldDefinition, required: boolean) {
    if (!manageable) return;
    const saved = await write.save({ name: field.name, identifier: field.identifier, type: field.type, multiple: field.multiple, required }, field);
    if (saved) page.refresh();
  }
  async function transition(field: CustomFieldDefinition) {
    if (!manageable) return; const saved = await write.transition(field, field.archivedAt ? "restore" : "archive");
    if (saved) page.refresh();
  }
  if (editing) return <CustomFieldEditor key={editing === "new" ? "new" : `${editing.id}:${editing.rowVersion}`} field={editing === "new" ? null : editing}
    scope={scope} canManageFields={manageable} canManageValues={connected && canManageValues} onClose={() => setEditing(null)}
    onSaved={field => { setEditing(field); page.refresh(); }} />;
  return <section className={css.page} data-testid="custom-fields-page">
    <header className={css.head}><h1>{ru ? "Кастомные поля" : "Custom fields"}</h1>{manageable && <button type="button" className={css.primary} onClick={() => { write.clearError(); setEditing("new"); }}>
      <Plus size={15} />{ru ? "Создать поле" : "Create field"}</button>}</header>
    <div className={css.toolbar}><label className={css.search}><Search size={15} aria-hidden="true"/><input value={page.search}
      aria-label={ru ? "Найти поле" : "Find a field"} placeholder={ru ? "Найти поле" : "Find a field"} onChange={event => page.setSearch(event.target.value)} /></label>
      <label><input type="checkbox" checked={page.status === "all"} onChange={event => page.setStatus(event.target.checked ? "all" : "active")} />{ru ? "Показать архивные" : "Include archived"}</label></div>
    {write.error && <p className={css.error} role="alert">{write.error}</p>}
    {!!page.failure && <p className={css.error} role="alert">{customFieldError(page.failure, ru)} <button type="button" className={css.secondary} onClick={page.refresh}>{ru ? "Повторить" : "Retry"}</button></p>}
    <div className={css.scroll} aria-busy={page.loading}>
      {page.loading ? <p className={css.status} role="status">{ru ? "Загрузка полей…" : "Loading fields…"}</p> : <>
        <table className={css.table}><thead><tr>{[ru ? "Поле" : "Custom field", ru ? "Идентификатор" : "Identifier", ru ? "Тип" : "Type",
          ru ? "Несколько" : "Multiple", ru ? "Обязательное" : "Required", ru ? "Обновлено" : "Updated at", ru ? "Автор изменения" : "Updated by"].map(title => <th scope="col" key={title}>{title}</th>)}<th scope="col"><span aria-label={ru ? "Действия" : "Actions"} /></th></tr></thead>
          <tbody>{page.items.map(field => <tr key={field.id} className={field.archivedAt ? css.archived : undefined}>
            <td><button className={css.name} type="button" onClick={() => setEditing(field)}>{customFieldLabel(field, ru)}</button></td>
            <td><span className={css.identifier} title={field.identifier}>{field.identifier}</span></td><td>{field.type[0].toUpperCase() + field.type.slice(1)}</td>
            <td>{field.multiple ? (ru ? "Да" : "Yes") : (ru ? "Нет" : "No")}</td>
            <td><FieldToggle checked={field.required} onChange={value => void required(field, value)} disabled={!manageable || write.pending || Boolean(field.archivedAt)}
              label={`${ru ? "Обязательное поле" : "Required field"}: ${customFieldLabel(field, ru)}`} /></td>
            <td className={css.updated}>{new Date(field.updatedAt).toLocaleString(languageTag, { dateStyle: "short", timeStyle: "short" })}</td>
            <td><span className={css.by} title={field.updatedBy?.displayName}>{field.updatedBy?.displayName ?? "Falcon"}</span></td>
            <td>{manageable && <FieldRowMenu ru={ru} name={field.name} archived={Boolean(field.archivedAt)} disabled={write.pending} canArchive={!field.systemKey}
              onEdit={() => setEditing(field)} onTransition={() => void transition(field)} />}</td>
          </tr>)}</tbody>
        </table>
        {!page.items.length && !page.failure && <p className={css.empty}>{!connected ? (ru ? "Для справочника требуется подключение." : "Connect to manage custom fields.")
          : page.search ? (ru ? "Поля не найдены." : "No fields found.") : (ru ? "Полей пока нет." : "No fields yet.")}</p>}
        {page.cursor && <div className={css.more}><button type="button" className={css.secondary} disabled={page.pending} onClick={() => void page.more()}>{ru ? "Показать ещё" : "Load more"}</button></div>}
      </>}
    </div>
  </section>;
}
