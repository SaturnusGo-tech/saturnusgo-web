import { Button } from "@heroui/react";
import { useState } from "react";
import type { StaticResource } from "../../model/catalog/static-resource";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import { formatDataValue } from "../../application/editor/field-input";
import { StaticEditor } from "./StaticEditor";
import { DataFeedback } from "../shared/DataFeedback";
import css from "../shared/data.module.css";
import reader from "../resource-reader/styles/resource-reader.module.css";

export function StaticDetails({ resource, ru, onClose, onUpdated }: { resource: StaticResource; ru: boolean; onClose(): void; onUpdated(value?: StaticResource): void }) {
  const context = useTestData(), command = useDataCommand(), [editing, setEditing] = useState(false), [confirm, setConfirm] = useState(false);
  const archived = resource.status === "ARCHIVED", environment = context?.environments.find(item => item.id === resource.environmentId);
  if (editing) return <StaticEditor current={resource} ru={ru} onClose={() => setEditing(false)} onSaved={value => { setEditing(false); onUpdated(value); }} />;
  return <section className={reader.pane} aria-label={resource.name}>
    <header className={reader.header}><div><h2 className={reader.heading}>{resource.name}</h2><span className={reader.kind}>Static Data · {resource.dataType}</span></div>
      <Button isIconOnly className={reader.close} aria-label={ru ? "Закрыть ресурс" : "Close resource"} onPress={onClose}>×</Button></header>
    <div className={reader.body}><div className={reader.content}>
      {resource.description && <p className={reader.description}>{resource.description}</p>}
      {resource.environmentId && <span className={reader.environment}>{environment?.name ?? (ru ? "Окружение недоступно" : "Environment unavailable")}</span>}
      <div><h3>{ru ? "Значение" : "Value"}</h3><pre className={reader.value}>{formatDataValue(resource.value)}</pre></div>
      {resource.warnings.length > 0 && <p className={css.notice}>{ru ? "Проверьте классификацию данных: значение может содержать конфиденциальную информацию." : "Review the data classification: this value may contain sensitive information."}</p>}
      <DataFeedback error={command.error} ru={ru} />
      {confirm ? <div className={css.notice}><p>{archived ? (ru ? "Восстановить ресурс?" : "Restore this resource?") : (ru ? "Архивировать ресурс? Сохранённые версии останутся в истории." : "Archive this resource? Saved versions remain in history.")}</p>
        <div className={css.actions}><Button className={css.button} isDisabled={command.pending} onPress={() => setConfirm(false)}>{ru ? "Отмена" : "Cancel"}</Button>
          <Button className={`${css.button} ${css.primary}`} isLoading={command.pending} onPress={() => {
            if (!context?.workspace) return;
            void command.execute((signal, key) => context.workspace!.archiveStatic(resource, archived, key, signal)).then(result => { if (result.ok) onUpdated(); });
          }}>{ru ? "Подтвердить" : "Confirm"}</Button></div></div>
        : <div className={css.actions}>{!archived && context?.permissions.update && <Button className={css.button} onPress={() => setEditing(true)}>{ru ? "Изменить" : "Edit"}</Button>}
          {context?.permissions.archive && <Button className={`${css.button} ${css.quiet}`} onPress={() => setConfirm(true)}>{archived ? (ru ? "Восстановить" : "Restore") : (ru ? "Архивировать" : "Archive")}</Button>}</div>}
    </div></div>
  </section>;
}
