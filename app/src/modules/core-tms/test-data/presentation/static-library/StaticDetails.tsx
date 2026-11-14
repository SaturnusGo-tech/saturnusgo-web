import { Button } from "@heroui/react";
import { Archive, ArchiveRestore, Pencil, X } from "lucide-react";
import { useState } from "react";
import type { StaticResource } from "../../model/catalog/static-resource";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import { formatDataValue } from "../../application/editor/field-input";
import { FalconTooltip } from "../../../presentation/common/tooltip/FalconTooltip";
import { StaticEditor } from "./StaticEditor";
import { DataFeedback } from "../shared/DataFeedback";
import { DataModal } from "../shared/DataModal";
import css from "./static-details.module.css";

const valueLabels = {
  String: ["Text value", "Текстовое значение"], Integer: ["Integer value", "Целое число"],
  Decimal: ["Decimal value", "Десятичное число"], Boolean: ["Boolean value", "Логическое значение"],
  Email: ["Email address", "Email"], URL: ["URL", "URL"], Date: ["Date", "Дата"],
  DateTime: ["Date and time", "Дата и время"], JSON: ["JSON value", "JSON"],
} as const;

export function StaticDetails({ resource, ru, onClose, onUpdated }: { resource: StaticResource; ru: boolean; onClose(): void; onUpdated(value?: StaticResource): void }) {
  const context = useTestData(), command = useDataCommand(), [editing, setEditing] = useState(false), [confirm, setConfirm] = useState(false);
  const archived = resource.status === "ARCHIVED", environment = context?.environments.find(item => item.id === resource.environmentId);
  const valueLabel = valueLabels[resource.dataType][ru ? 1 : 0], value = formatDataValue(resource.value);
  const editLabel = ru ? "Изменить статические данные" : "Edit static data";
  const archiveLabel = archived ? (ru ? "Восстановить ресурс" : "Restore resource") : (ru ? "Архивировать ресурс" : "Archive resource");
  const closeLabel = ru ? "Закрыть ресурс" : "Close resource";
  async function archive() {
    if (!context?.workspace || !context.permissions.archive) return;
    const result = await command.execute((signal, key) => context.workspace!.archiveStatic(resource, archived, key, signal), `${resource.id}:${resource.revision}:${archived}`);
    if (result.ok) { setConfirm(false); onUpdated(); }
  }
  if (editing) return <StaticEditor current={resource} ru={ru} onClose={() => setEditing(false)} onSaved={value => { setEditing(false); onUpdated(value); }} />;
  return <section className={css.pane} aria-label={resource.name} data-static-detail={resource.id}>
    <header className={css.header}><h2>{resource.name}</h2><div className={css.actions}>
      {!archived && context?.permissions.update && <FalconTooltip label={editLabel}><Button isIconOnly disableRipple className={css.icon} aria-label={editLabel} onPress={() => setEditing(true)}><Pencil size={15} /></Button></FalconTooltip>}
      {context?.permissions.archive && <FalconTooltip label={archiveLabel}><Button isIconOnly disableRipple className={css.icon} aria-label={archiveLabel} onPress={() => { command.clearError(); setConfirm(true); }}>{archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}</Button></FalconTooltip>}
      <FalconTooltip label={closeLabel}><Button isIconOnly disableRipple className={css.icon} aria-label={closeLabel} onPress={onClose}><X size={17} /></Button></FalconTooltip>
    </div></header>
    <div className={css.body}><dl className={css.fields}>
      <div className={css.field}><dt>{ru ? "Название" : "Name"}</dt><dd>{resource.name}</dd></div>
      <div className={css.field}><dt>{ru ? "Описание" : "Description"}</dt><dd className={resource.description ? undefined : css.muted}>{resource.description || (ru ? "Описание не указано" : "No description")}</dd></div>
      <div className={css.field}><dt>{ru ? "Окружение" : "Environment"}</dt><dd>{resource.environmentId ? environment?.name ?? (ru ? "Окружение недоступно" : "Environment unavailable") : (ru ? "Любое окружение" : "Any environment")}</dd></div>
      <div className={css.field}><dt>{ru ? "Тип данных" : "Data type"}</dt><dd>{resource.dataType}</dd></div>
      <div className={css.field}><dt>{valueLabel}</dt><dd>{resource.dataType === "JSON"
        ? <pre className={css.json}>{value}</pre>
        : <output className={css.value} aria-label={valueLabel}>{resource.value === "" ? (ru ? "Пустая строка" : "Empty string") : value}</output>}</dd></div>
      {archived && <div className={css.field}><dt>{ru ? "Статус" : "Status"}</dt><dd>{ru ? "В архиве" : "Archived"}</dd></div>}
    </dl>
      {resource.warnings.length > 0 && <p className={css.notice}>{ru ? "Проверьте классификацию данных: значение может содержать конфиденциальную информацию." : "Review the data classification: this value may contain sensitive information."}</p>}
      {!confirm && command.error && <div className={css.feedback}><DataFeedback error={command.error} ru={ru} /></div>}
    </div>
    {confirm && <DataModal title={archived ? (ru ? "Восстановить ресурс?" : "Restore this resource?") : (ru ? "Архивировать ресурс?" : "Archive this resource?")} onClose={() => { if (!command.pending) setConfirm(false); }}>
      <p className={css.confirmCopy}>{archived ? (ru ? "Ресурс снова станет доступен для новых привязок." : "The resource will become available for new bindings again.") : (ru ? "Сохранённые версии останутся в истории." : "Saved versions remain in history.")}</p>
      <DataFeedback error={command.error} ru={ru} />
      <div className={css.confirmActions}><Button type="button" disableRipple className={css.button} isDisabled={command.pending} onPress={() => setConfirm(false)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="button" disableRipple className={`${css.button} ${css.primary}`} isLoading={command.pending} onPress={() => void archive()}>{archived ? (ru ? "Восстановить" : "Restore") : (ru ? "Архивировать" : "Archive")}</Button></div>
    </DataModal>}
  </section>;
}
