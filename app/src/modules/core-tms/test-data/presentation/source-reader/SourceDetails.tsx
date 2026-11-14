import { Button } from "@heroui/react";
import { Archive, Database, FileSpreadsheet, Pencil, X } from "lucide-react";
import { useState } from "react";
import { WorkspaceTextField } from "../workspace-fields/WorkspaceTextField";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import { defaultSourceQuery } from "../../application/workspace-query/default-source-query";
import type { DataSource } from "../../model/workspace/data-workspace";
import { DataFeedback } from "../shared/DataFeedback";
import { DataModal } from "../shared/DataModal";
import { SqlQueryPanel } from "../workspace-query/SqlQueryPanel";
import css from "../workspace-layout/workspace.module.css";

export function SourceDetails({ source, ru, onClose, onUpdated }: { source: DataSource; ru: boolean; onClose(): void; onUpdated(): void }) {
  const feature = useTestData(), command = useDataCommand(), [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState(false), [name, setName] = useState(source.name), [description, setDescription] = useState(source.description);
  const leave = useFormLeave({ name, description }, { busy: command.pending });
  const editable = Boolean(feature?.workspace && feature.permissions.update && source.status === "ACTIVE");
  const [query, setQuery] = useState(() => defaultSourceQuery(source));
  async function save() {
    if (!editable || !name.trim()) return;
    const draft = { name: name.trim(), description: description.trim() };
    const result = await command.execute((signal, key) => feature!.workspace!.updateSource(source, draft, key, signal), JSON.stringify([source.id, source.revision, draft]));
    if (result.ok) { leave.reset(draft); onUpdated(); }
  }
  function cancelEdit() { leave.close(() => { setName(source.name); setDescription(source.description); leave.reset({ name: source.name, description: source.description }); setEditing(false); }); }
  async function archive() {
    if (!feature?.workspace || !feature.permissions.archive) return;
    const result = await command.execute((signal, key) => feature.workspace!.archiveSource(source, key, signal), `${source.id}:${source.revision}`);
    if (result.ok) onUpdated();
  }
  return <section className={css.pane} data-source-detail={source.id}>
    <header className={css.header}><div><h2>{source.name}</h2><p>{source.kind === "FILE" ? (ru ? "Источник из файла" : "File source") : source.kind === "POSTMAN" ? "Postman Cloud Store" : source.kind === "POSTGRES" ? "PostgreSQL" : "MySQL"}</p></div>
      <div className={css.actions}>{editable && !editing && <Button type="button" isIconOnly disableRipple className={css.close} aria-label="Edit source" onPress={() => setEditing(true)}><Pencil size={16} /></Button>}
        {feature?.permissions.archive && source.status === "ACTIVE" && <Button type="button" isIconOnly disableRipple className={css.close} aria-label={ru ? "Архивировать источник" : "Archive source"} onPress={() => setConfirm(true)}><Archive size={16} /></Button>}
        <Button type="button" isIconOnly disableRipple className={css.close} aria-label="Close source" onPress={() => leave.close(onClose)}><X size={18} /></Button></div></header>
    <div className={css.dataBody}><div className={css.dataSummary}>
      {editing ? <form className={css.form} onSubmit={event => { event.preventDefault(); void save(); }}>
        <WorkspaceTextField label={ru ? "Название" : "Name"} ariaLabel="Source name" value={name} onValueChange={setName} maxLength={120} required disabled={command.pending} />
        <WorkspaceTextField multiline label={ru ? "Описание" : "Description"} ariaLabel="Source description" value={description} onValueChange={setDescription} maxLength={2000} disabled={command.pending} />
        <div className={css.actions}><Button type="button" disableRipple className={css.quiet} isDisabled={command.pending} onPress={cancelEdit}>{ru ? "Отмена" : "Cancel"}</Button>
          <Button type="submit" disableRipple className={css.primary} isLoading={command.pending} isDisabled={!name.trim() || !leave.dirty} onPress={() => void save()}>{ru ? "Сохранить" : "Save"}</Button></div>
      </form> : source.description && <p className={css.subtitle}>{source.description}</p>}
      <div className={css.metadata}><span>{source.kind === "FILE" ? <FileSpreadsheet size={16} /> : <Database size={16} />}</span>
        {source.connection?.host && <span>{source.connection.host}:{source.connection.port} · {source.connection.database}</span>}
        {source.kind === "POSTMAN" && <span>{source.connection?.region?.toUpperCase()} · Postman Cloud Store</span>}
        {source.kind === "FILE" && <span>{source.rowCount} {ru ? "строк" : "rows"}</span>}
        <span>{source.status === "ARCHIVED" ? (ru ? "Архивирован" : "Archived") : (ru ? "Активен" : "Active")}</span></div>
      <DataFeedback error={command.error} ru={ru} /></div>
      <SqlQueryPanel key={source.id} sourceIds={source.status === "ACTIVE" ? [source.id] : []} query={query} onChange={setQuery} ru={ru} autoRun={Boolean(defaultSourceQuery(source))} />
    </div>
    {confirm && <DataModal title={ru ? "Архивировать источник?" : "Archive source?"} onClose={() => { if (!command.pending) setConfirm(false); }}>
      <p className={css.subtitle}>{ru ? "Связанные датасеты сохранят ссылки. Новые запросы к архивированному источнику будут недоступны." : "Dataset links remain intact. Queries against this archived source will be unavailable."}</p>
      <div className={css.actions}><Button type="button" disableRipple className={css.quiet} isDisabled={command.pending} onPress={() => setConfirm(false)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="button" disableRipple className={css.primary} isLoading={command.pending} onPress={() => void archive()}>{ru ? "Архивировать" : "Archive"}</Button></div></DataModal>}
  </section>;
}
