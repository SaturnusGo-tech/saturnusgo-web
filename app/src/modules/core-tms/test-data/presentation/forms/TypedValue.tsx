import { SelectItem } from "@heroui/react";
import { IntegrationInput as Input } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { DataSelect as Select } from "../select/DataSelect";
import { IntegrationTextarea as Textarea } from "../../../presentation/common/integration-controls/textarea/IntegrationTextarea";
import type { DataType } from "../../model/bindings/binding";
import css from "../shared/data.module.css";
export function TypedValue({ type, value, onChange, label, ariaLabel, compact = false, disabled, secret = false, ru = false }: {
  type: DataType; value: string; onChange(value: string): void; label?: string; ariaLabel?: string; compact?: boolean; disabled?: boolean; secret?: boolean; ru?: boolean;
}) {
  const names: Record<DataType, string> = ru
    ? { String: "Текстовое значение", Integer: "Целое число", Decimal: "Десятичное число", Boolean: "Логическое значение", Email: "Email", URL: "URL", Date: "Дата", DateTime: "Дата и время", JSON: "JSON" }
    : { String: "Text value", Integer: "Integer value", Decimal: "Decimal value", Boolean: "Boolean value", Email: "Email address", URL: "URL", Date: "Date", DateTime: "Date and time", JSON: "JSON value" };
  const hints: Record<DataType, string> = ru ? {
    String: "Обычный текст. Пустая строка сохраняется как отдельное значение.",
    Integer: "Целое число без дробной части, например 42 или −1.",
    Decimal: "Используйте точку как десятичный разделитель, например 0.01. Точность сохраняется.",
    Boolean: "Выберите true (истина) или false (ложь).",
    Email: "Полный адрес, например qa@example.test.", URL: "Полный адрес с протоколом, например https://example.test.",
    Date: "Дата в формате ГГГГ-ММ-ДД, без времени.",
    DateTime: "Дата и время с часовым поясом, например 2026-11-14T09:30:00Z.",
    JSON: "Корректный JSON: объект, массив или другое JSON-значение.",
  } : {
    String: "Plain text. An empty string is stored as its own value.",
    Integer: "A whole number without a fraction, for example 42 or −1.",
    Decimal: "Use a decimal point, for example 0.01. The exact precision is preserved.",
    Boolean: "Choose true or false.", Email: "A complete address, for example qa@example.test.",
    URL: "A complete address including its protocol, for example https://example.test.",
    Date: "A date in YYYY-MM-DD format, without a time.",
    DateTime: "Include a time zone, for example 2026-11-14T09:30:00Z.",
    JSON: "Valid JSON: an object, array, or another JSON value.",
  };
  const placeholders: Partial<Record<DataType, string>> = {
    Integer: "42", Decimal: "0.01", Email: "qa@example.test", URL: "https://example.test",
    Date: "YYYY-MM-DD", DateTime: "2026-11-14T09:30:00Z", JSON: '{ "key": "value" }',
  };
  const visibleLabel = label ?? (secret ? (ru ? "Защищённое значение" : "Secret value") : names[type]);
  const common = { "aria-label": ariaLabel ?? visibleLabel, label: visibleLabel, description: secret || compact ? undefined : hints[type],
    placeholder: secret ? undefined : placeholders[type], labelPlacement: "outside" as const, isDisabled: disabled };
  const classes = { base: css.fieldControl, label: compact ? css.tableLabel : css.controlLabel, inputWrapper: css.inputShell, input: css.input, description: css.formHint };
  if (type === "Boolean" && !secret) return <Select disableAnimation {...common}
    selectedKeys={[value === "true" ? "true" : "false"]} onSelectionChange={keys => onChange(String([...keys][0] ?? "false"))}
    classNames={{ base: css.fieldControl, label: classes.label, trigger: css.inputShell, value: css.input }}>
    {["false", "true"].map(item => <SelectItem key={item}>{item}</SelectItem>)}</Select>;
  if (type === "JSON" && !secret) return <Textarea {...common} value={value} onValueChange={onChange}
    minRows={2} maxRows={7} isDisabled={disabled} classNames={{ ...classes, inputWrapper: `${css.inputShell} ${css.textareaShell}`, input: `${css.input} ${css.code}` }} />;
  const inputType = secret ? "password" : type === "Email" ? "email" : type === "URL" ? "url" : type === "Date" ? "date" : "text";
  return <Input {...common} value={value} onValueChange={onChange} type={inputType}
    inputMode={!secret && type === "Decimal" ? "decimal" : !secret && type === "Integer" ? "numeric" : undefined}
    autoComplete="off" spellCheck="false"
    classNames={classes} />;
}
