import { PiCheck, PiPencilSimple } from "react-icons/pi";
import { MarkdownField } from "../../../../presentation/cases/inspector/markdown/MarkdownField";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import css from "../../styles/editor.module.css";

export function OrganizationMarkdownField({ label, value, placeholder, editing, disabled, onEdit, onClose, onChange }: {
  label: string; value: string; placeholder: string; editing: boolean; disabled: boolean;
  onEdit: () => void; onClose: () => void; onChange: (value: string) => void;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  return <section className={css.markdownSection} aria-label={label}>
    <header><h2>{label}</h2><button type="button" className={css.editText} disabled={disabled}
      aria-label={`${editing ? (ru ? "Завершить редактирование" : "Finish editing") : (ru ? "Редактировать" : "Edit")}: ${label}`}
      onClick={editing ? onClose : onEdit}>
      {editing ? <><PiCheck aria-hidden="true" />{ru ? "Готово" : "Done"}</> : <PiPencilSimple aria-hidden="true" />}
    </button></header>
    <div className={`${css.markdownContent}`}>
      <MarkdownField appearance="plain" onRequestEdit={!disabled ? onEdit : undefined} label={label} value={value} emptyLabel={placeholder} compact allowAttachments={false}
        autoFocus={editing} onChange={editing && !disabled ? onChange : undefined} />
    </div>
    {value.length > 20000 && <p className={css.limit} role="alert">{ru ? "Максимум 20 000 символов." : "Maximum 20,000 characters."}</p>}
  </section>;
}
