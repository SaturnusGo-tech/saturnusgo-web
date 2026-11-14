import { Button } from "@heroui/react";
import { IntegrationInput as Input } from "../../../../presentation/common/integration-controls/input/IntegrationInput";
import { useState } from "react";
import { DataModal as Modal } from "../../shared/DataModal";
import { useFormLeave } from "../../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../../application/context/TestDataContext";
import { useDataCommand } from "../../../application/command/useDataCommand";
import type { Credential } from "../../../model/resources/resource";
import { DataFeedback } from "../../shared/DataFeedback";
import css from "../../shared/data.module.css";
export function RotateCredential({ credential, ru, onSaved, onClose }: { credential: Credential; ru: boolean; onSaved(): void; onClose(): void }) {
  const feature = useTestData(), command = useDataCommand();
  const [values, setValues] = useState<Record<string, string>>({}), [edited, setEdited] = useState(0);
  const leave = useFormLeave({ edited }, { busy: command.pending });
  return <Modal title={ru ? "Обновить защищённые значения" : "Rotate secrets"} subtitle={credential.name} onClose={() => void leave.close(onClose)}>
    <form autoComplete="off" className={css.form} onSubmit={event => {
      event.preventDefault(); if (!feature) return;
      const changed = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
      if (!Object.keys(changed).length) return;
      void command.execute((signal, key) => feature.port.rotateCredential(credential, changed, key, signal), String(edited)).then(result => {
        if (result.ok) { setValues({}); leave.release(); onSaved(); }
      });
    }}>
      <p className={css.formHint}>{ru ? "Укажите новые значения только для нужных полей. Текущие исполнения не переключатся на новую версию автоматически." : "Enter new values for the fields you need to change. Active executions do not switch versions automatically."}</p>
      {credential.fields.filter(field => field.isSecret).map(field => <Input key={field.key} label={field.key} labelPlacement="outside" type="password" autoComplete="new-password"
        value={values[field.key] ?? ""} onValueChange={value => { setValues(current => ({ ...current, [field.key]: value })); setEdited(value => value + 1); }}
        isDisabled={command.pending} classNames={{ base: css.fieldControl, label: css.controlLabel, inputWrapper: css.inputShell, input: css.input }} />)}
      <DataFeedback error={command.error} denied={!feature?.permissions.rotate} ru={ru} />
      <div className={css.footer}><Button className={`${css.button} ${css.quiet}`} isDisabled={command.pending} onPress={() => void leave.close(onClose)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="submit" className={`${css.button} ${css.primary}`} isLoading={command.pending} isDisabled={!feature?.permissions.rotate || !Object.values(values).some(Boolean)}>{ru ? "Обновить" : "Rotate secrets"}</Button></div>
    </form>
  </Modal>;
}
