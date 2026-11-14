"use client";
import { Button, SelectItem } from "@heroui/react";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { WorkspaceTextField } from "../workspace-fields/WorkspaceTextField";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import type { DatasetView, WorkspaceDataset } from "../../model/workspace/data-workspace";
import { DataFeedback } from "../shared/DataFeedback";
import { DataSelect } from "../select/DataSelect";
import { SqlQueryPanel } from "../workspace-query/SqlQueryPanel";
import css from "../workspace-layout/workspace.module.css";
import viewCss from "./view-reader.module.css";

export function DataView({ dataset, view, ru, onClose, onUpdated, onBack }: { dataset: WorkspaceDataset; view: DatasetView; ru: boolean;
  onClose(): void; onUpdated(value: WorkspaceDataset): void; onBack?(): void }) {
  const feature = useTestData(), command = useDataCommand(), [name, setName] = useState(view.name), [query, setQuery] = useState(view.query), [sourceIds, setSourceIds] = useState(view.sourceIds);
  const [editing, setEditing] = useState(false);
  const draft = { name, query, sourceIds }, leave = useFormLeave(draft, { busy: command.pending });
  const allowed = Boolean(feature?.workspace && feature.permissions.update && dataset.status === "ACTIVE");
  async function save() {
    if (!allowed || !name.trim() || !query.trim() || !sourceIds.length) return;
    const result = await command.execute((signal, key) => feature!.workspace!.saveView(dataset, { ...draft, name: name.trim() }, view.id, key, signal), JSON.stringify([dataset.id, dataset.revision, view.id, draft]));
    if (result.ok) { leave.reset(draft); onUpdated(result.value); }
  }
  return <section className={css.pane} data-view-detail={view.id}>
    <header className={css.header}><div><h2>{onBack && <Button type="button" isIconOnly disableRipple className={css.close} aria-label={ru ? "К датасету" : "Back to dataset"} onPress={() => leave.close(onBack)}><ArrowLeft size={16} /></Button>}{dataset.name} › {view.name}</h2>
      <p>{ru ? "Представление данных" : "Data view"}</p></div><div className={css.actions}>
        {allowed && <Button type="button" isIconOnly disableRipple className={css.close} aria-label={ru ? "Изменить представление" : "Edit view details"} onPress={() => setEditing(value => !value)}><Pencil size={15} /></Button>}
        {allowed && <Button type="button" disableRipple startContent={<Save size={15} />} className={css.primary} isDisabled={!leave.dirty || !name.trim() || !query.trim() || !sourceIds.length} isLoading={command.pending} onPress={() => void save()}>{ru ? "Сохранить" : "Save"}</Button>}
        <Button type="button" isIconOnly disableRipple className={css.close} aria-label="Close view" onPress={() => leave.close(onClose)}><X size={18} /></Button></div></header>
    <div className={css.dataBody}>
      {editing && <div className={css.dataSummary}><div className={viewCss.controls}><WorkspaceTextField label={ru ? "Название" : "View name"} ariaLabel="View name" value={name} onValueChange={setName} maxLength={120} disabled={!allowed || command.pending} />
        <div className={css.field}><span className={css.fieldLabel}>{ru ? "Источники" : "Sources"}</span><DataSelect aria-label="View sources" selectedKeys={new Set(sourceIds)} selectionMode="multiple" disabledKeys={dataset.sources.filter(source => source.status !== "ACTIVE").map(source => source.id)} isDisabled={!allowed || command.pending} onSelectionChange={keys => setSourceIds(Array.from(keys).map(String))}>
          {dataset.sources.map(source => <SelectItem key={source.id}>{source.name}</SelectItem>)}</DataSelect></div></div></div>}
      <DataFeedback error={command.error} ru={ru} />
      <SqlQueryPanel key={view.id} sourceIds={dataset.status === "ACTIVE" ? sourceIds : []} query={query} onChange={setQuery} ru={ru} autoRun />
    </div>
  </section>;
}
