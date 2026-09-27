import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { CustomFieldDefinition, CustomFieldScope, CustomFieldValue } from "../../model/custom-field";
import { customFieldError } from "../../application/field-errors";
import { customValueLabel } from "../../application/field-labels";
import { useCustomFieldValues } from "../../state/values/useCustomFieldValues";
import { useFieldValueWrite } from "../../state/values/useFieldValueWrite";
import { FieldRowMenu } from "../shared/FieldRowMenu";
import { CustomFieldValueForm } from "./CustomFieldValueForm";
import css from "../shared/customFields.module.css";
export function CustomFieldValues({ scope, field, canManage }: { scope: CustomFieldScope; field: CustomFieldDefinition; canManage: boolean }) {
  const { locale, languageTag } = useTmsLocale(); const ru = locale === "ru";
  const page = useCustomFieldValues({ ...scope, fieldId: field.id }); const write = useFieldValueWrite(scope, field.id, ru);
  const [edit, setEdit] = useState<CustomFieldValue | "new" | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  async function transition(value: CustomFieldValue) {
    if (!canManage) return; setTransitioningId(value.id);
    const saved = await write.transition(value, value.archivedAt ? "restore" : "archive");
    setTransitioningId(null); if (saved) page.refresh();
  }
  return <section aria-labelledby="custom-field-values-title">
    <h2 id="custom-field-values-title" className={css.sectionTitle}>{ru ? "Значения поля" : "Field values"}</h2>
    <div className={css.valueTools}><label className={css.search}><Search size={15} aria-hidden="true" /><input value={page.search}
      aria-label={ru ? "Найти значение" : "Find a value"} placeholder={ru ? "Найти значение" : "Find a value"} onChange={event => page.setSearch(event.target.value)} /></label>
      <div className={css.headActions}><label className={css.hint}><input type="checkbox" checked={page.status === "all"}
        onChange={event => page.setStatus(event.target.checked ? "all" : "active")} /> {ru ? "Показать архивные" : "Include archived"}</label>
        {canManage && <button type="button" className={css.secondary} onClick={() => setEdit("new")} disabled={write.pending}><Plus size={14} />{ru ? "Добавить" : "Add"}</button>}</div>
    </div>
    {edit && canManage && <CustomFieldValueForm key={edit === "new" ? "new" : `${edit.id}:${edit.rowVersion}`} scope={scope} field={field}
      current={edit === "new" ? null : edit} ru={ru} onClose={() => setEdit(null)} onExisting={setEdit}
      onSaved={() => { setEdit(null); page.refresh(); }} />}
    {write.error && <p className={css.error} role="alert">{write.error}</p>}
    {!!page.failure && <p className={css.error} role="alert">{customFieldError(page.failure, ru)} <button type="button" className={css.secondary} onClick={page.refresh}>{ru ? "Повторить" : "Retry"}</button></p>}
    {page.loading ? <p className={css.status} role="status">{ru ? "Загрузка значений…" : "Loading values…"}</p> : <>
      <table className={css.table}><thead><tr><th scope="col">{ru ? "Значение" : "Value"}</th><th scope="col">{ru ? "Обновлено" : "Updated at"}</th>
        <th scope="col">{ru ? "Автор изменения" : "Updated by"}</th><th scope="col"><span aria-label={ru ? "Действия" : "Actions"} /></th></tr></thead>
        <tbody>{page.items.map(value => <tr key={value.id} className={value.archivedAt ? css.archived : undefined}>
          <td><button className={css.name} type="button" onClick={() => canManage && setEdit(value)} disabled={!canManage}>{customValueLabel(value, ru)}</button>
            {(value.isLegacy || value.archivedAt) && <p className={css.hint}>{value.archivedAt ? (ru ? "В архиве" : "Archived") : (ru ? "Без группы" : "Unclassified")}</p>}</td>
          <td className={css.updated}>{new Date(value.updatedAt).toLocaleString(languageTag, { dateStyle: "short", timeStyle: "short" })}</td>
          <td><span className={css.by} title={value.updatedBy?.displayName}>{value.updatedBy?.displayName ?? "Falcon"}</span></td>
          <td>{canManage && <FieldRowMenu ru={ru} name={value.label} archived={Boolean(value.archivedAt)} disabled={write.pending || transitioningId === value.id}
            onEdit={() => setEdit(value)} onTransition={() => void transition(value)} />}</td>
        </tr>)}</tbody>
      </table>
      {!page.items.length && !page.failure && <p className={css.empty}>{page.search ? (ru ? "Значения не найдены." : "No values found.") : (ru ? "Значений пока нет." : "No values yet.")}</p>}
      {page.cursor && <div className={css.more}><button type="button" className={css.secondary} disabled={page.pending} onClick={() => void page.more()}>{ru ? "Показать ещё" : "Load more"}</button></div>}
    </>}
  </section>;
}
