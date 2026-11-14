"use client";
import { Button } from "@heroui/react";
import { Archive, Database, Table2, X } from "lucide-react";
import { useState } from "react";
import { WorkspaceTextField } from "../workspace-fields/WorkspaceTextField";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import type { DataSource, WorkspaceDataset } from "../../model/workspace/data-workspace";
import { DataFeedback } from "../shared/DataFeedback";
import { DataModal } from "../shared/DataModal";
import { SourceLinkDialog } from "../workspace-source-picker/SourceLinkDialog";
import { CreateViewDialog } from "../view-editor/CreateViewDialog";
import { AddSourceMenu } from "../workspace-source-menu/AddSourceMenu";
import css from "../workspace-layout/workspace.module.css";
import local from "./dataset-workspace.module.css";

export function DatasetWorkspace({ dataset, ru, onClose, onUpdated, onOpenSource, onOpenView }: {
  dataset: WorkspaceDataset | null; ru: boolean; onClose(): void; onUpdated(value: WorkspaceDataset): void; onOpenSource(id: string): void; onOpenView(id: string): void;
}) {
  const feature = useTestData(), command = useDataCommand(), [name, setName] = useState(dataset?.name ?? ""), [description, setDescription] = useState(dataset?.description ?? "");
  const [dialog, setDialog] = useState<"source" | "view" | "archive" | null>(null);
  const [sourceKind, setSourceKind] = useState<DataSource["kind"]>();
  const leave = useFormLeave({ name, description }, { busy: command.pending });
  const editable = Boolean(feature?.workspace && (dataset ? feature.permissions.update && dataset.status === "ACTIVE" : feature.permissions.create));
  async function save() {
    if (!editable || !name.trim() || !feature?.workspace) return;
    const draft = { name: name.trim(), description: description.trim() };
    const result = await command.execute((signal, key) => feature.workspace!.saveDataset(draft, dataset, key, signal), JSON.stringify([dataset?.id, dataset?.revision, draft]));
    if (result.ok) { leave.reset(draft); onUpdated(result.value); }
  }
  async function archive() {
    if (!dataset || !feature?.workspace || !feature.permissions.archive) return;
    const result = await command.execute((signal, key) => feature.workspace!.archiveDataset(dataset, dataset.status === "ARCHIVED", key, signal), `${dataset.id}:${dataset.revision}:archive`);
    if (result.ok) { setDialog(null); onUpdated(result.value); }
  }
  function updated(value: WorkspaceDataset) { setDialog(null); onUpdated(value); }
  return <section className={css.pane} data-dataset-workspace={dataset?.id ?? "new"}>
    <header className={`${css.header} ${local.header}`}><div><h2>{dataset?.name ?? (ru ? "Новый датасет" : "New dataset")}</h2></div><div className={css.actions}>
      {editable && <Button type="button" disableRipple className={local.save} isLoading={command.pending} isDisabled={!name.trim() || (Boolean(dataset) && !leave.dirty)} onPress={() => void save()}>{dataset ? (ru ? "Сохранить" : "Save") : (ru ? "Создать" : "Create")}</Button>}
      {dataset && feature?.permissions.archive && <Button type="button" isIconOnly disableRipple className={css.close} aria-label={dataset.status === "ARCHIVED" ? (ru ? "Восстановить датасет" : "Restore dataset") : (ru ? "Архивировать датасет" : "Archive dataset")} onPress={() => setDialog("archive")}><Archive size={15} /></Button>}
      <Button type="button" isIconOnly disableRipple className={css.close} aria-label="Close dataset" onPress={() => leave.close(onClose)}><X size={18} /></Button></div></header>
    <div className={`${css.body} ${local.body}`}><div className={local.summary}>
      <form className={css.form} onSubmit={event => { event.preventDefault(); void save(); }}>
        <WorkspaceTextField label={ru ? "Название" : "Name"} ariaLabel="Dataset name" value={name} onValueChange={setName} maxLength={120} required disabled={!editable || command.pending} />
        <div className={local.description}><WorkspaceTextField multiline label={ru ? "Описание" : "Description"} ariaLabel="Dataset description" placeholder={ru ? "Добавить описание…" : "Add description…"} value={description} onValueChange={setDescription} maxLength={2000} disabled={!editable || command.pending} /></div>
        <DataFeedback error={command.error} ru={ru} />
      </form>
      <section className={css.section}><h3>{ru ? "Источники данных" : "Data source(s)"}</h3><p className={css.subtitle}>{ru ? "Исходные данные датасета. Добавьте источник или импортируйте CSV, JSON либо Excel." : "The raw data behind this dataset. Add a source or import a CSV, JSON, or spreadsheet file."}</p>
        <div className={css.rows}>{dataset?.sources.map(source => <Button type="button" disableRipple key={source.id} className={css.row} onPress={() => onOpenSource(source.id)}><Database size={15} /><span>{source.name}</span></Button>)}</div>
        {editable && <div className={`${css.actions} ${local.actions}`}><AddSourceMenu ru={ru} isDisabled={!dataset || command.pending} onChoose={kind => { setSourceKind(kind === "EXISTING" ? undefined : kind); setDialog("source"); }} /></div>}
        {!dataset && editable && <p className={local.hint}>{ru ? "Укажите название и нажмите «Создать», чтобы добавить источники." : "Enter a name and choose Create to add sources."}</p>}
      </section>
      <section className={css.section}><h3>{ru ? "Представления" : "Data views"}</h3><p className={css.subtitle}>{ru ? "Именованные запросы, выбирающие нужную часть исходных данных." : "Named queries that select a specific slice of your sources."}</p>
        <div className={css.rows}>{dataset?.views.map(view => <Button type="button" disableRipple key={view.id} className={css.row} onPress={() => onOpenView(view.id)}><Table2 size={17} /><span>{view.name}</span></Button>)}</div>
        {editable && <div className={`${css.actions} ${local.actions}`}><Button type="button" disableRipple className={css.quiet} isDisabled={!dataset?.sources.some(source => source.status === "ACTIVE") || command.pending} onPress={() => setDialog("view")}>{ru ? "Создать представление" : "Create view"}</Button></div>}
      </section>
    </div></div>
    {dataset && dialog === "source" && <SourceLinkDialog dataset={dataset} initialKind={sourceKind} ru={ru} onClose={() => setDialog(null)} onLinked={updated} />}
    {dataset && dialog === "view" && <CreateViewDialog dataset={dataset} ru={ru} onClose={() => setDialog(null)} onSaved={updated} />}
    {dataset && dialog === "archive" && <DataModal title={dataset.status === "ARCHIVED" ? (ru ? "Восстановить датасет?" : "Restore dataset?") : (ru ? "Архивировать датасет?" : "Archive dataset?")} onClose={() => { if (!command.pending) setDialog(null); }}>
      <p className={css.subtitle}>{ru ? "Связанные источники и представления сохраняются." : "Linked sources and views are preserved."}</p><div className={css.actions}>
        <Button type="button" disableRipple className={css.quiet} isDisabled={command.pending} onPress={() => setDialog(null)}>{ru ? "Отмена" : "Cancel"}</Button><Button type="button" disableRipple className={css.primary} isLoading={command.pending} onPress={() => void archive()}>{ru ? "Подтвердить" : "Confirm"}</Button></div></DataModal>}
  </section>;
}
