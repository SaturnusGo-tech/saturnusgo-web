import { SelectItem } from "@heroui/react";
import { IntegrationInput as Input } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { DataSelect as Select } from "../select/DataSelect";
import { IntegrationTextarea as Textarea } from "../../../presentation/common/integration-controls/textarea/IntegrationTextarea";
import type { DataType } from "../../model/bindings/binding";
import css from "../shared/data.module.css";
export function TypedValue({ type, value, onChange, label, disabled, secret = false }: {
  type: DataType; value: string; onChange(value: string): void; label: string; disabled?: boolean; secret?: boolean;
}) {
  if (type === "Boolean" && !secret) return <Select disableAnimation aria-label={label} label={label} labelPlacement="outside"
    selectedKeys={[value === "true" ? "true" : "false"]} onSelectionChange={keys => onChange(String([...keys][0] ?? "false"))}
    isDisabled={disabled} classNames={{ trigger: css.inputShell, value: css.input }}>
    {["false", "true"].map(item => <SelectItem key={item}>{item}</SelectItem>)}</Select>;
  if (type === "JSON" && !secret) return <Textarea aria-label={label} label={label} labelPlacement="outside" value={value} onValueChange={onChange}
    minRows={2} maxRows={7} isDisabled={disabled} classNames={{ inputWrapper: css.inputShell, input: `${css.input} ${css.code}` }} />;
  return <Input aria-label={label} label={label} labelPlacement="outside" value={value} onValueChange={onChange}
    type={secret ? "password" : "text"} autoComplete="off" spellCheck="false" isDisabled={disabled}
    classNames={{ inputWrapper: css.inputShell, input: css.input }} />;
}
