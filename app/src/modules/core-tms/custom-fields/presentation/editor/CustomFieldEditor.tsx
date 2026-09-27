import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { customFieldTypes, type CustomFieldDefinition, type CustomFieldDraft, type CustomFieldScope } from "../../model/custom-field";
import { fieldDraftError } from "../../model/field-validation";
import { useCustomFieldWrite } from "../../state/catalog/useCustomFieldWrite";
import { FieldToggle } from "../shared/FieldToggle";
import { CustomFieldValues } from "../values/CustomFieldValues";
import css from "../shared/customFields.module.css";
export function CustomFieldEditor({ field, scope, canManageFields, canManageValues, onSaved, onClose }: {
  field: CustomFieldDefinition | null; scope: CustomFieldScope; canManageFields: boolean; canManageValues: boolean;
  onSaved(field: CustomFieldDefinition): void; onClose(): void;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [draft, setDraft] = useState<CustomFieldDraft>(field ? { name: field.name, identifier: field.identifier,
    type: field.type, multiple: field.multiple, required: field.required } : { name: "", identifier: "", type: "string", multiple: false, required: false });
  const [validation, setValidation] = useState(""); const write = useCustomFieldWrite(scope, ru);
  const readonly = !canManageFields || write.pending || Boolean(field?.archivedAt);
  const change = <K extends keyof CustomFieldDraft>(key: K, value: CustomFieldDraft[K]) => { setDraft(current => ({ ...current, [key]: value })); setValidation(""); write.clearError(); };
  async function save() {
    if (readonly) return; const error = fieldDraftError(draft, ru); setValidation(error); if (error) return;
    const saved = await write.save({ ...draft, name: draft.name.trim() }, field); if (saved) onSaved(saved);
  }
  return <section className={css.page}>
    <header className={css.head}><div className={css.headActions}><button type="button" className={css.icon} onClick={onClose} disabled={write.pending}
      aria-label={ru ? "Все кастомные поля" : "All custom fields"}><ArrowLeft size={18} /></button><h1>{field ? (ru ? "Настройка поля" : "Field settings") : (ru ? "Новое поле" : "New field")}</h1></div></header>
    <div className={css.scroll}>
      <form id="custom-field-definition" className={css.form} onSubmit={event => { event.preventDefault(); void save(); }}>
        <input className={css.nameInput} value={draft.name} placeholder={ru ? "Название поля" : "Field name"} aria-label={ru ? "Название поля" : "Field name"}
          maxLength={200} disabled={readonly} onChange={event => change("name", event.target.value)} />
        <div className={css.row}><label htmlFor="custom-field-identifier">{ru ? "Идентификатор" : "Identifier"}</label><div>
          <input id="custom-field-identifier" className={css.input} value={draft.identifier} maxLength={64} disabled={readonly || Boolean(field?.systemKey)}
            onChange={event => change("identifier", event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          <p className={css.hint}>{ru ? "Строчные латинские буквы, цифры, точки, дефисы и подчёркивания." : "Lowercase letters, digits, dots, hyphens and underscores."}</p>
        </div></div>
        <div className={css.row}><span id="custom-field-type">{ru ? "Тип" : "Type"}</span><div className={css.choices} role="radiogroup" aria-labelledby="custom-field-type">
          {customFieldTypes.map(type => <label key={type}><input type="radio" name="field-type" value={type} checked={draft.type === type}
            disabled={readonly || Boolean(field?.systemKey)} onChange={() => change("type", type)} />{type[0].toUpperCase() + type.slice(1)}</label>)}
        </div></div>
        <div className={css.row}><span id="custom-field-multiple">{ru ? "Значения" : "Values"}</span><div className={css.choices} role="radiogroup" aria-labelledby="custom-field-multiple">
          {[false, true].map(multiple => <label key={String(multiple)}><input type="radio" name="field-multiple" checked={draft.multiple === multiple}
            disabled={readonly || Boolean(field?.systemKey)} onChange={() => change("multiple", multiple)} />{multiple ? (ru ? "Несколько" : "Multiple") : (ru ? "Одно" : "Single")}</label>)}
        </div></div>
        <div className={css.row}><span>{ru ? "Обязательное" : "Required"}</span><div className={css.choices}>
          <FieldToggle checked={draft.required} onChange={value => change("required", value)} disabled={readonly} label={ru ? "Обязательное поле" : "Required field"} />
          <span className={css.hint}>{ru ? "Проверяется при сохранении тест-кейса." : "Checked when saving a test case."}</span>
        </div></div>
        {(validation || write.error) && <p className={css.error} role="alert">{validation || write.error}</p>}
      </form>
      {field ? <CustomFieldValues field={field} scope={scope} canManage={canManageValues && !field.archivedAt} />
        : <p className={css.hint}>{ru ? "Сохраните поле, чтобы добавить значения." : "Save the field to add values."}</p>}
    </div>
    <footer className={css.footer}>{canManageFields && <button className={css.primary} type="submit" form="custom-field-definition" disabled={readonly}>{write.pending ? (ru ? "Сохранение…" : "Saving…") : (ru ? "Сохранить" : "Save")}</button>}
      <button className={css.secondary} type="button" onClick={onClose} disabled={write.pending}>{ru ? "Закрыть" : "Close"}</button></footer>
  </section>;
}
