"use client";
import { Button } from "@heroui/react";
import { Archive, Database, Table2, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
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
  const [savedDataset, setSavedDataset] = useState(dataset), [validation, setValidation] = useState<string | null>(null);
  const previousId = useRef(dataset?.id ?? null);
  const leave = useFormLeave({ name, description }, { busy: command.pending });
  const current = dataset && (dataset.id !== savedDataset?.id || dataset.revision >= savedDataset.revision) ? dataset : savedDataset;
  const editable = Boolean(feature?.workspace && (current ? feature.permissions.update && current.status === "ACTIVE" : feature.permissions.create));
  useLayoutEffect(() => {
    const incomingId = dataset?.id ?? null;
    if (previousId.current === incomingId) return;
    previousId.current = incomingId;
    if (dataset && dataset.id === savedDataset?.id) return;
    const draft = { name: dataset?.name ?? "", description: dataset?.description ?? "" };
    setSavedDataset(dataset); setName(draft.name); setDescription(draft.description); setDialog(null); setValidation(null); leave.reset(draft);
  }, [dataset, savedDataset, leave]);
  async function save() {
    if (!editable || !feature?.workspace || command.pending) return null;
    if (!name.trim()) { setValidation(ru ? "Укажите название датасета, чтобы продолжить." : "Enter a dataset name to continue."); return null; }
    setValidation(null);
    const draft = { name: name.trim(), description: description.trim() };
    if (current && current.name === draft.name && current.description === draft.description) return current;
    const result = await command.execute((signal, key) => feature.workspace!.saveDataset(draft, current, key, signal), JSON.stringify([current?.id, current?.revision, draft]));
    if (!result.ok) return null;
    setSavedDataset(result.value); leave.reset(draft); onUpdated(result.value); return result.value;
  }
  async function openDialog(next: "source" | "view", kind?: DataSource["kind"]) {
    if (!feature?.permissions.update) { setValidation(ru ? "Для добавления источников и представлений нужно право редактирования." : "Editing permission is required to add sources and views."); return; }
    const container = await save();
    if (container) { setSourceKind(kind); setDialog(next); }
  }
  async function archive() {
    if (!current || !feature?.workspace || !feature.permissions.archive) return;
    const result = await command.execute((signal, key) => feature.workspace!.archiveDataset(current, current.status === "ARCHIVED", key, signal), `${current.id}:${current.revision}:archive`);
    if (result.ok) updated(result.value);
  }
  function updated(value: WorkspaceDataset) { setSavedDataset(value); setDialog(null); onUpdated(value); }
  return <section className={css.pane} data-dataset-workspace={current?.id ?? "new"}>
    <header className={`${css.header} ${local.header}`}><div><h2>{current?.name ?? (ru ? "Новый датасет" : "New dataset")}</h2></div><div className={css.actions}>
      {editable && <Button type="button" disableRipple className={local.save} isLoading={command.pending} isDisabled={!name.trim() || (Boolean(current) && !leave.dirty)} onPress={() => void save()}>{current ? (ru ? "Сохранить" : "Save") : (ru ? "Создать" : "Create")}</Button>}
      {current && feature?.permissions.archive && <Button type="button" isIconOnly disableRipple className={css.close} aria-label={current.status === "ARCHIVED" ? (ru ? "Восстановить датасет" : "Restore dataset") : (ru ? "Архивировать датасет" : "Archive dataset")} onPress={() => setDialog("archive")}><Archive size={15} /></Button>}
      <Button type="button" isIconOnly disableRipple className={css.close} aria-label="Close dataset" onPress={() => leave.close(onClose)}><X size={18} /></Button></div></header>
    <div className={`${css.body} ${local.body}`}><div className={local.summary}>
      <form className={css.form} onSubmit={event => { event.preventDefault(); void save(); }}>
        <WorkspaceTextField label={ru ? "Название" : "Name"} ariaLabel="Dataset name" value={name} onValueChange={value => { setName(value); setValidation(null); }} maxLength={120} required disabled={!editable || command.pending} />
        <div className={local.description}><WorkspaceTextField multiline label={ru ? "Описание" : "Description"} ariaLabel="Dataset description" placeholder={ru ? "Добавить описание…" : "Add description…"} value={description} onValueChange={setDescription} maxLength={2000} disabled={!editable || command.pending} /></div>
        <DataFeedback error={command.error} ru={ru} />
        {validation && <p className={local.validation} role="alert">{validation}</p>}
      </form>
      <section className={css.section}><h3>{ru ? "Источники данных" : "Data source(s)"}</h3><p className={css.subtitle}>{ru ? "Исходные данные датасета. Добавьте источник или импортируйте CSV, JSON либо Excel." : "The raw data behind this dataset. Add a source or import a CSV, JSON, or spreadsheet file."}</p>
        <div className={css.rows}>{current?.sources.map(source => <Button type="button" disableRipple key={source.id} className={css.row} onPress={() => onOpenSource(source.id)}><Database size={15} /><span>{source.name}</span></Button>)}</div>
        {editable && <div className={`${css.actions} ${local.actions}`}><AddSourceMenu ru={ru} isDisabled={command.pending} onChoose={kind => void openDialog("source", kind === "EXISTING" ? undefined : kind)} /></div>}
      </section>
      <section className={css.section}><h3>{ru ? "Представления" : "Data views"}</h3><p className={css.subtitle}>{ru ? "Именованные запросы, выбирающие нужную часть исходных данных." : "Named queries that select a specific slice of your sources."}</p>
        <div className={css.rows}>{current?.views.map(view => <Button type="button" disableRipple key={view.id} className={css.row} onPress={() => onOpenView(view.id)}><Table2 size={17} /><span>{view.name}</span></Button>)}</div>
        {editable && <div className={`${css.actions} ${local.actions}`}><Button type="button" disableRipple className={css.quiet} isDisabled={command.pending} onPress={() => void openDialog("view")}>{ru ? "Создать представление" : "Create view"}</Button></div>}
      </section>
    </div></div>
    {current && dialog === "source" && <SourceLinkDialog dataset={current} initialKind={sourceKind} ru={ru} onClose={() => setDialog(null)} onLinked={updated} />}
    {current && dialog === "view" && <CreateViewDialog dataset={current} ru={ru} onClose={() => setDialog(null)} onSaved={updated} onAddSource={() => { setSourceKind(undefined); setDialog("source"); }} />}
    {current && dialog === "archive" && <DataModal title={current.status === "ARCHIVED" ? (ru ? "Восстановить датасет?" : "Restore dataset?") : (ru ? "Архивировать датасет?" : "Archive dataset?")} onClose={() => { if (!command.pending) setDialog(null); }}>
      <p className={css.subtitle}>{ru ? "Связанные источники и представления сохраняются." : "Linked sources and views are preserved."}</p><div className={css.actions}>
        <Button type="button" disableRipple className={css.quiet} isDisabled={command.pending} onPress={() => setDialog(null)}>{ru ? "Отмена" : "Cancel"}</Button><Button type="button" disableRipple className={css.primary} isLoading={command.pending} onPress={() => void archive()}>{ru ? "Подтвердить" : "Confirm"}</Button></div></DataModal>}
  </section>;
}
