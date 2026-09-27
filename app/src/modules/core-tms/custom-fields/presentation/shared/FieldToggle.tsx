import css from "./customFields.module.css";
export function FieldToggle({ checked, onChange, disabled, label }: {
  checked: boolean; onChange?(value: boolean): void; disabled?: boolean; label: string;
}) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label}
    disabled={disabled || !onChange} onClick={() => onChange?.(!checked)} className={css.toggle}><span /></button>;
}
