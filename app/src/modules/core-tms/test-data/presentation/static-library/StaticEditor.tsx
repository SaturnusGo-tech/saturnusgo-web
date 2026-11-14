import { Button, SelectItem } from "@heroui/react";
import { useState } from "react";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import { formatDataValue, parseDataInput } from "../../application/editor/field-input";
import type { StaticResource } from "../../model/catalog/static-resource";
import { dataTypes, type DataType } from "../../model/bindings/binding";
import { ResourceEditorFrame } from "../editor-frame/ResourceEditorFrame";
import { WorkspaceTextField } from "../workspace-fields/WorkspaceTextField";
import { DataSelect } from "../select/DataSelect";
import { DataFeedback } from "../shared/DataFeedback";
import { TypedValue } from "../forms/TypedValue";
import css from "../shared/data.module.css";
import frame from "../editor-frame/resource-editor.module.css";
import workspace from "../workspace-layout/workspace.module.css";

export function StaticEditor({ current, ru, onSaved, onClose }: { current?: StaticResource; ru: boolean; onSaved(value: StaticResource): void; onClose(): void }) {
  const context = useTestData(), command = useDataCommand();
  const [name, setName] = useState(current?.name ?? ""), [description, setDescription] = useState(current?.description ?? "");
  const [environmentId, setEnvironment] = useState(current?.environmentId ?? ""), [dataType, setType] = useState<DataType>(current?.dataType ?? "String");
  const [text, setText] = useState(current ? formatDataValue(current.value) : ""), [invalid, setInvalid] = useState(false);
  const leave = useFormLeave({ name, description, environmentId, dataType, text }, { busy: command.pending });
  const allowed = Boolean(context?.workspace && (current ? context.permissions.update : context.permissions.create));
  const disabled = command.pending || !allowed;
  const environments = [{ id: "__none__", name: ru ? "Любое окружение" : "Any environment" }, ...context?.environments ?? []];
  return <ResourceEditorFrame inline ru={ru} busy={command.pending} title={current ? (ru ? "Изменить статические данные" : "Edit static data") : (ru ? "Создать статические данные" : "New static data")} onClose={() => void leave.close(onClose)}>
    <form className={`${workspace.form} ${frame.form}`} onSubmit={event => {
      event.preventDefault(); if (!allowed || !context?.workspace) return;
      let value: string | boolean;
      try { value = parseDataInput(dataType, text); setInvalid(false); } catch { setInvalid(true); return; }
      const draft = { name, description, environmentId: environmentId || null, dataType, value };
      void command.execute((signal, key) => context.workspace!.saveStatic(draft, current ?? null, key, signal), JSON.stringify(draft))
        .then(result => { if (result.ok) { leave.release(); onSaved(result.value); } });
    }}>
      <div className={frame.body}><div className={frame.fields}>
        <WorkspaceTextField required label={ru ? "Название" : "Name"} ariaLabel="Name" value={name} onValueChange={setName} maxLength={120} disabled={disabled} />
        <WorkspaceTextField multiline label={ru ? "Описание" : "Description"} ariaLabel="Description" value={description} onValueChange={setDescription} placeholder={ru ? "Добавить описание…" : "Add description…"} maxLength={2000} disabled={disabled} />
        <div className={css.fieldControl}><span className={css.controlLabel}>{ru ? "Окружение" : "Environment"}</span>
          <DataSelect aria-label={ru ? "Окружение" : "Environment"} selectedKeys={[environmentId || "__none__"]} isDisabled={disabled}
            onSelectionChange={keys => { const selected = String([...keys][0] ?? ""); setEnvironment(selected === "__none__" ? "" : selected); }}>
            {environments.map(item => <SelectItem key={item.id}>{item.name}</SelectItem>)}
          </DataSelect></div>
        <div className={css.fieldControl}><span className={css.controlLabel}>{ru ? "Тип данных" : "Data type"}</span>
        <DataSelect aria-label={ru ? "Тип данных" : "Data type"} selectedKeys={[dataType]} isDisabled={disabled}
          onSelectionChange={keys => { const value = String([...keys][0]); if (dataTypes.includes(value as DataType)) { setType(value as DataType); setText(value === "Boolean" ? "false" : ""); setInvalid(false); } }}>
          {dataTypes.map(type => <SelectItem key={type}>{type}</SelectItem>)}
        </DataSelect></div>
        <TypedValue type={dataType} value={text} onChange={setText} ariaLabel={ru ? "Значение" : "Value"} ru={ru} disabled={disabled} />
        {invalid && <p className={css.error} role="alert">{ru ? "Проверьте значение JSON." : "Check the JSON value."}</p>}
        <DataFeedback error={command.error} denied={!allowed} ru={ru} />
      </div></div>
      <footer className={frame.footer}><Button type="button" disableRipple className={`${css.button} ${css.quiet}`} isDisabled={command.pending} onPress={() => void leave.close(onClose)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="submit" disableRipple className={`${css.button} ${css.primary}`} isLoading={command.pending} isDisabled={!allowed}>{ru ? "Сохранить" : "Save"}</Button></footer>
    </form>
  </ResourceEditorFrame>;
}
