import { useTestData } from "../../application/context/TestDataContext";
import { useCaseData } from "../../application/editor/CaseDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import { DataValidation } from "../validation/DataValidation";
import { DataFeedback } from "../shared/DataFeedback";
import type { DataFinding } from "../../model/bindings/binding";
import { Button, SelectItem } from "@heroui/react";
import { IntegrationInput as Input } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { DataSelect as Select } from "../select/DataSelect";
import { IntegrationSwitch as Switch } from "../../../presentation/common/integration-controls/switch/IntegrationSwitch";
import { useState } from "react";
import { DataModal as Modal } from "../shared/DataModal";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { dataTypes, type TestDataBinding, type DataType } from "../../model/bindings/binding";
import { formatDataValue, parseDataInput } from "../../application/editor/field-input";
import { TypedValue } from "../forms/TypedValue";
import { WorkspaceTextField } from "../workspace-fields/WorkspaceTextField";
import { bindingFieldMessage } from "../validation/binding-field-message";
import css from "../shared/data.module.css";
type Static = Extract<TestDataBinding, { sourceType: "STATIC" }>;
export function StaticDataEditor({ initial, ru, onSave, onClose }: { initial?: Static; ru: boolean; onSave(value: Static): void; onClose(): void }) {
  const feature = useTestData(), data = useCaseData(), command = useDataCommand();
  const [findings, setFindings] = useState<readonly DataFinding[]>([]);
  const [name, setName] = useState(initial?.staticDefinition.name ?? ""), [alias, setAlias] = useState(initial?.alias ?? "");
  const [type, setType] = useState<DataType>(initial?.staticDefinition.type ?? "String");
  const [value, setValue] = useState(initial ? formatDataValue(initial.staticDefinition.value) : ""), [description, setDescription] = useState(initial?.staticDefinition.description ?? "");
  const [required, setRequired] = useState(initial?.required ?? true);
  const [error, setError] = useState(false);
  const leave = useFormLeave({ name, alias, type, value, description, required }, { busy: command.pending });
  return <Modal title={ru ? "Статические данные" : "Static data"} onClose={() => void leave.close(onClose)}>
    <form className={css.form} onSubmit={event => {
      event.preventDefault();
      if (!feature) return;
      let binding: Static;
      try { binding = { id: initial?.id ?? crypto.randomUUID(), alias, required, sourceType: "STATIC",
        staticDefinition: { name, type, value: parseDataInput(type, value), ...(description ? { description } : {}) } }; }
      catch { setError(true); return; }
      const bindings = [...(data?.bindings ?? []).filter(item => item.id !== initial?.id), binding];
      void command.execute(signal => feature.port.validate(bindings, [], signal, data?.savedCase), JSON.stringify(binding)).then(result => {
        if (!result.ok) return;
        if (!result.value.valid) { setFindings(result.value.errors); return; }
        leave.release(); onSave(binding);
      });
    }}>
      <div className={css.formGrid}>
        <WorkspaceTextField label={ru ? "Название" : "Name"} ariaLabel="Name" required value={name} onValueChange={setName} disabled={command.pending} maxLength={feature?.configuration.limits.nameLength} />
        <Input label="Alias" labelPlacement="outside" isRequired value={alias} onValueChange={next => { setAlias(next); setFindings([]); }} isDisabled={command.pending}
          isInvalid={findings.some(item => item.alias === alias && item.code === "TEST_DATA_ALIAS_INVALID")}
          description={bindingFieldMessage("TEST_DATA_ALIAS_INVALID", ru)} maxLength={feature?.configuration.limits.aliasLength} classNames={{ base: css.fieldControl, label: css.controlLabel, description: css.formHint, inputWrapper: css.inputShell, input: css.input }} />
      </div>
      <Select disableAnimation isDisabled={command.pending} label={ru ? "Тип данных" : "Data type"} labelPlacement="outside" selectedKeys={[type]}
        onSelectionChange={keys => { const next = [...keys][0] as DataType; if (next) { setType(next); if (next === "Boolean") setValue("false"); } }}
        classNames={{ trigger: css.inputShell, value: css.input }}>{dataTypes.map(item => <SelectItem key={item}>{item}</SelectItem>)}</Select>
      <TypedValue disabled={command.pending} type={type} value={value} onChange={setValue} ru={ru} ariaLabel={ru ? "Значение" : "Value"} />
      <WorkspaceTextField multiline label={ru ? "Описание" : "Description"} ariaLabel="Description" value={description} onValueChange={setDescription} disabled={command.pending} maxLength={feature?.configuration.limits.descriptionLength} />
      <Switch isDisabled={command.pending} size="sm" color="default" isSelected={required} onValueChange={setRequired}>{ru ? "Обязательно для выполнения" : "Required for execution"}</Switch>
      <p className={css.formHint}>{ru ? "Пароли и токены добавляйте через Secure Credentials." : "Use Secure Credentials for passwords and tokens."}</p>
      {error && <p className={css.error} role="alert">{ru ? "Укажите корректный JSON." : "Enter valid JSON."}</p>}
      <DataValidation findings={findings} ru={ru} /><DataFeedback error={command.error} ru={ru} />
      <div className={css.footer}><Button type="button" className={`${css.button} ${css.quiet}`} onPress={() => void leave.close(onClose)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="submit" isLoading={command.pending} isDisabled={!feature?.permissions.bind} className={`${css.button} ${css.primary}`}>{ru ? "Добавить" : "Save value"}</Button></div>
    </form>
  </Modal>;
}
