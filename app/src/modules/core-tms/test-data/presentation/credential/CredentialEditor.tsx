import { Button } from "@heroui/react";
import { WorkspaceTextField } from "../workspace-fields/WorkspaceTextField";
import { useState } from "react";
import { ResourceEditorFrame } from "../editor-frame/ResourceEditorFrame";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import type { Credential } from "../../model/resources/resource";
import { ResourceFields, type EditableField } from "../forms/ResourceFields";
import { DataEnvironmentSelect } from "../environment/DataEnvironmentSelect";
import { DataFeedback } from "../shared/DataFeedback";
import css from "../shared/data.module.css";
import frame from "../editor-frame/resource-editor.module.css";
export function CredentialEditor({ current, ru, onSaved, onClose, inline = false }: { current?: Credential; ru: boolean; onSaved(value: Credential): void; onClose(): void; inline?: boolean }) {
  const context = useTestData(), command = useDataCommand();
  const [name, setName] = useState(current?.name ?? ""), [description, setDescription] = useState(current?.description ?? "");
  const [environmentId, setEnvironment] = useState(current?.environmentId ?? ""), [edited, setEdited] = useState(0);
  const [fields, setFields] = useState<readonly EditableField[]>([{ localId: crypto.randomUUID(), key: "email", type: "Email", text: "", isSecret: false },
    { localId: crypto.randomUUID(), key: "password", type: "String", text: "", isSecret: true }]);
  // The authoring coordinator receives only a change counter, never secret form values.
  const leave = useFormLeave({ name, description, environmentId, edited }, { busy: command.pending });
  const content = <>
    <WorkspaceTextField required label={ru ? "Название" : "Name"} ariaLabel="Name" value={name} onValueChange={setName} maxLength={context?.configuration.limits.nameLength} disabled={command.pending} />
    <WorkspaceTextField multiline label={ru ? "Описание" : "Description"} ariaLabel="Description" value={description} onValueChange={setDescription} placeholder={ru ? "Добавить описание…" : "Add description…"} maxLength={context?.configuration.limits.descriptionLength} disabled={command.pending} />
    {current ? <div><p className={css.muted}>{ru ? "Схема защищённых полей" : "Protected field schema"}</p><ul className={css.rows}>{current.fields.map(field => <li className={css.row} key={field.key}>
      <span className={css.code}>{field.key}</span><span className={css.muted}>{field.type} · {field.isSecret ? (ru ? "Защищено" : "Protected") : (ru ? "Обычное поле" : "Non-secret")}</span></li>)}</ul></div>
      : <><DataEnvironmentSelect value={environmentId} onChange={setEnvironment} required ru={ru} disabled={command.pending} />
        <ResourceFields fields={fields} onChange={value => { setFields(value); setEdited(count => count + 1); }} credentials ru={ru} disabled={command.pending} />
        <p className={css.formHint}>{ru ? "Пароли и токены отмечайте как защищённые. Значения сохраняются отдельно от сценария." : "Protect passwords and tokens. Their values are stored separately from scenario text."}</p></>}
    <DataFeedback error={command.error} ru={ru} denied={!context || !(current ? context.permissions.credentialUpdate : context.permissions.credentialCreate)} />
  </>;
  return <ResourceEditorFrame inline={inline} ru={ru} busy={command.pending} title={current ? (ru ? "Учётные данные" : "Credential details") : (ru ? "Создать учётные данные" : "Create credential")}
    onClose={() => void leave.close(onClose)}>
    <form className={`${css.form} ${inline ? frame.form : ""}`} autoComplete="off" onSubmit={event => {
      event.preventDefault(); if (!context) return;
      const input = { name, description, environmentId, fields: current ? [] : fields.map(({ key, type, text, isSecret }) => ({ key, type, value: text, isSecret })) };
      void command.execute((signal, key) => context.port.saveCredential(input, current ?? null, key, signal), JSON.stringify({ name, description, environmentId, edited })).then(result => {
        if (result.ok) { setFields([]); leave.release(); onSaved(result.value); }
      });
    }}>
      {inline ? <div className={frame.body}><div className={frame.fields}>{content}</div></div> : content}
      <div className={`${css.footer} ${inline ? frame.footer : ""}`}><Button type="button" className={`${css.button} ${css.quiet}`} isDisabled={command.pending} onPress={() => void leave.close(onClose)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="submit" className={`${css.button} ${css.primary}`} isLoading={command.pending} isDisabled={!context || !(current ? context.permissions.credentialUpdate : context.permissions.credentialCreate)}>{current ? (ru ? "Сохранить" : "Save details") : (ru ? "Создать" : "Create credential")}</Button></div>
    </form>
  </ResourceEditorFrame>;
}
