import { SelectItem } from "@heroui/react";
import { DataSelect as Select } from "../select/DataSelect";
import { useTestData } from "../../application/context/TestDataContext";
import css from "../shared/data.module.css";
export function DataEnvironmentSelect({ value, onChange, required, ru, disabled }: { value: string; onChange(value: string): void; required?: boolean; ru: boolean; disabled?: boolean }) {
  const context = useTestData(), items = context?.environments ?? [];
  const choices = required ? items : [{ id: "__none__", name: ru ? "Любое окружение" : "Any environment" }, ...items];
  return <Select disableAnimation label={ru ? "Окружение" : "Environment"} labelPlacement="outside" isRequired={required}
    placeholder={ru ? "Выберите окружение" : "Choose environment"} selectedKeys={value ? [value] : required ? [] : ["__none__"]}
    isDisabled={disabled || !context} onSelectionChange={keys => { const selected = String([...keys][0] ?? ""); onChange(selected === "__none__" ? "" : selected); }}
    classNames={{ trigger: css.inputShell, value: css.input }}>
    {choices.map(item => <SelectItem key={item.id}>{item.name}</SelectItem>)}
  </Select>;
}
