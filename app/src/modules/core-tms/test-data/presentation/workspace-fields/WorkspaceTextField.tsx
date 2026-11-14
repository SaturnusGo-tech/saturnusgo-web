import { useId } from "react";
import { IntegrationInput } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { IntegrationTextarea } from "../../../presentation/common/integration-controls/textarea/IntegrationTextarea";
import css from "./workspace-field.module.css";

export function WorkspaceTextField({ label, ariaLabel, value, onValueChange, multiline, disabled, required, maxLength, placeholder, type, autoComplete, description, min, max }: {
  label: string; ariaLabel: string; value: string; onValueChange(value: string): void; multiline?: boolean; disabled?: boolean; required?: boolean;
  maxLength?: number; placeholder?: string; type?: string; autoComplete?: string; description?: string; min?: number; max?: number;
}) {
  const id = useId(), common = { id, "aria-label": ariaLabel, value, onValueChange, isDisabled: disabled, isRequired: required, maxLength, placeholder, description };
  return <div className={css.field}><label htmlFor={id} className={css.label}>{label}</label>
    {multiline ? <IntegrationTextarea {...common} minRows={3} maxRows={6} classNames={{ inputWrapper: css.shell, input: css.input }} />
      : <IntegrationInput {...common} type={type} autoComplete={autoComplete} min={min} max={max} classNames={{ inputWrapper: css.shell, input: css.input }} />}
  </div>;
}
