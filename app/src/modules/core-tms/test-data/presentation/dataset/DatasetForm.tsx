import { Button } from "@heroui/react";
import { IntegrationInput as Input } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { useState } from "react";
import { DataModal as Modal } from "../shared/DataModal";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import { formatDataValue, parseDataInput } from "../../application/editor/field-input";
import type { Dataset, DatasetVersion } from "../../model/resources/resource";
import { ResourceFields, type EditableField } from "../forms/ResourceFields";
import { DataEnvironmentSelect } from "../environment/DataEnvironmentSelect";
import { DataFeedback } from "../shared/DataFeedback";
import css from "../shared/data.module.css";
export function DatasetForm({ current, version, ru, onSaved, onClose }: { current?: Dataset; version?: DatasetVersion; ru: boolean; onSaved(value: Dataset): void; onClose(): void }) {
  const context = useTestData(), command = useDataCommand();
  const [name, setName] = useState(current?.name ?? ""), [description, setDescription] = useState(current?.description ?? "");
  const [environmentId, setEnvironment] = useState(version?.environmentId ?? ""), [invalidJson, setInvalidJson] = useState(false);
  const [fields, setFields] = useState<readonly EditableField[]>(() => version?.fields.map(field => ({ ...field, localId: crypto.randomUUID(),
    text: formatDataValue(field.value), isSecret: false })) ?? [{ localId: crypto.randomUUID(), key: "", type: "String", text: "", isSecret: false }]);
  const leave = useFormLeave({ name, description, environmentId, fields }, { busy: command.pending });
  return <Modal title={current ? (ru ? "Новая версия набора" : "New dataset version") : (ru ? "Создать набор данных" : "Create dataset")}
    subtitle={current ? `${current.name} · ${ru ? "Текущая версия" : "Current version"} ${current.currentVersion}` : undefined} wide onClose={() => void leave.close(onClose)}>
    <form className={css.form} onSubmit={event => {
      event.preventDefault(); if (!context) return;
      let parsed;
      try { parsed = fields.map(field => ({ key: field.key, type: field.type, value: parseDataInput(field.type, field.text), ...(field.description ? { description: field.description } : {}) })); }
      catch { setInvalidJson(true); return; }
      void command.execute((signal, key) => context.port.saveDataset({ name, description, environmentId: environmentId || null, fields: parsed }, current ?? null, key, signal), JSON.stringify({ name, description, environmentId, fields }))
        .then(result => { if (result.ok) { leave.release(); onSaved(result.value); } });
    }}>
      <Input autoFocus isRequired label={ru ? "Название" : "Name"} labelPlacement="outside" value={name} onValueChange={setName} maxLength={context?.configuration.limits.nameLength} isDisabled={command.pending} classNames={{ inputWrapper: css.inputShell, input: css.input }} />
      <Input label={ru ? "Описание" : "Description"} labelPlacement="outside" value={description} onValueChange={setDescription} maxLength={context?.configuration.limits.descriptionLength} isDisabled={command.pending} classNames={{ inputWrapper: css.inputShell, input: css.input }} />
      <DataEnvironmentSelect value={environmentId} onChange={setEnvironment} ru={ru} disabled={command.pending} />
      <ResourceFields fields={fields} onChange={setFields} ru={ru} disabled={command.pending} />
      {current && <p className={css.notice}>{ru ? "Сохранение создаст неизменяемую версию. Привязки существующих кейсов останутся прежними." : "Saving creates an immutable version. Existing case bindings keep their selected version."}</p>}
      {invalidJson && <p className={css.error} role="alert">{ru ? "Проверьте синтаксис JSON в полях." : "Check the JSON syntax in your fields."}</p>}
      <DataFeedback error={command.error} ru={ru} denied={!context || !(current ? context.permissions.update : context.permissions.create)} />
      <div className={css.footer}><Button type="button" className={`${css.button} ${css.quiet}`} isDisabled={command.pending} onPress={() => void leave.close(onClose)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="submit" className={`${css.button} ${css.primary}`} isLoading={command.pending} isDisabled={!context || !(current ? context.permissions.update : context.permissions.create)}>{current ? (ru ? "Сохранить версию" : "Save version") : (ru ? "Создать набор" : "Create dataset")}</Button></div>
    </form>
  </Modal>;
}
