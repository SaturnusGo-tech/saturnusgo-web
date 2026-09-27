import { useEffect, useState } from "react";
import { customFieldError } from "../../application/field-errors";
import type { CustomFieldDefinition, CustomFieldScope, CustomFieldSelection, CustomFieldValue } from "../../model/custom-field";
import { parseFieldValue } from "../../model/field-validation";
import { useFieldValueWrite } from "../../state/values/useFieldValueWrite";
import { useParentField } from "../../state/parent/useParentField";
import { useParentValue } from "../../state/parent/useParentValue";
import { CustomFieldPicker } from "../picker/CustomFieldPicker";
import css from "../shared/customFields.module.css";
export function CustomFieldValueForm({ scope, field, current, ru, onSaved, onClose, onExisting }: {
  scope: CustomFieldScope; field: CustomFieldDefinition; current: CustomFieldValue | null; ru: boolean;
  onSaved(): void; onClose(): void; onExisting(value: CustomFieldValue): void;
}) {
  const [input, setInput] = useState(current ? String(current.value) : field.type === "boolean" ? "true" : "");
  const [group, setGroup] = useState<readonly CustomFieldSelection[]>([]); const [validation, setValidation] = useState("");
  const parent = useParentField(scope, field.parentFieldId);
  const parentValue = useParentValue(scope, field.parentFieldId, current?.parentValueId ?? null);
  const write = useFieldValueWrite(scope, field.id, ru);
  useEffect(() => { if (parentValue.value) setGroup([parentValue.value]); }, [parentValue.value]);
  async function save(confirmedSimilarValueIds?: readonly string[]) {
    const value = parseFieldValue(input, field.type);
    if (value === null) { setValidation(ru ? "Введите корректное значение выбранного типа." : "Enter a valid value of the selected type."); return; }
    if (field.systemKey === "product" && !group.length && !current?.isLegacy) { setValidation(ru ? "Выберите группу продуктов." : "Choose a product group."); return; }
    setValidation(""); const saved = await write.save({ value, parentValueId: group[0]?.id ?? null, confirmedSimilarValueIds }, current);
    if (saved) onSaved();
  }
  return <form className={css.valueForm} onSubmit={event => { event.preventDefault(); void save(); }}>
    {parent.field && <div className={css.row}><span>{ru ? "Группа продуктов" : "Product group"}</span>
      <CustomFieldPicker {...scope} field={parent.field} selected={group} onChange={values => { setGroup(values); write.reset(); setValidation(""); }} canCreate disabled={write.pending || parentValue.loading} />
    </div>}
    {!!(parent.failure || parentValue.failure) && <p role="alert" className={css.error}>{customFieldError(parent.failure || parentValue.failure, ru)}</p>}
    <div className={css.row}><label htmlFor="custom-field-value">{ru ? "Значение" : "Value"}</label>
      {field.type === "boolean" ? <select id="custom-field-value" className={css.input} value={input} disabled={write.pending} onChange={event => { setInput(event.target.value); write.reset(); }}>
        <option value="true">{ru ? "Да" : "Yes"}</option><option value="false">{ru ? "Нет" : "No"}</option>
      </select> : <input id="custom-field-value" className={css.input} value={input} autoFocus disabled={write.pending} maxLength={500}
        inputMode={field.type === "string" ? "text" : "decimal"} onChange={event => { setInput(event.target.value); write.reset(); setValidation(""); }} />}
    </div>
    {write.conflict && <div className={css.warning}><p>{write.conflict.kind === "exact" ? (ru ? "Такое значение уже существует." : "This value already exists.")
      : (ru ? "Найдены похожие значения. Проверьте, нужен ли отдельный вариант." : "Similar values exist. Check whether you need a separate entry.")}</p>
      {write.conflict.values.map(value => <button type="button" className={css.secondary} key={value.id} onClick={() => onExisting(value)}>{value.label}</button>)}
      {write.conflict.kind === "similar" && <button type="button" className={css.secondary} disabled={write.pending}
        onClick={() => void save(write.conflict!.values.map(value => value.id))}>{ru ? "Создать отдельное значение" : "Create a separate value"}</button>}
    </div>}
    {(validation || write.error) && <p role="alert" className={css.error}>{validation || write.error}</p>}
    <div className={css.valueActions}><button type="submit" className={css.primary} disabled={write.pending || parent.loading || parentValue.loading || !!(parent.failure || parentValue.failure)}>
      {write.pending ? (ru ? "Сохранение…" : "Saving…") : current ? (ru ? "Сохранить значение" : "Save value") : (ru ? "Добавить" : "Add")}</button>
      <button type="button" className={css.secondary} disabled={write.pending} onClick={onClose}>{ru ? "Отмена" : "Cancel"}</button></div>
  </form>;
}
