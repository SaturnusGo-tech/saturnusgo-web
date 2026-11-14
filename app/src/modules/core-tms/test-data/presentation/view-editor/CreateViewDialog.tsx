import { Button, SelectItem } from "@heroui/react";
import { useState } from "react";
import { WorkspaceTextField } from "../workspace-fields/WorkspaceTextField";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import { defaultSourceQuery } from "../../application/workspace-query/default-source-query";
import type { WorkspaceDataset } from "../../model/workspace/data-workspace";
import { DataModal } from "../shared/DataModal";
import { DataFeedback } from "../shared/DataFeedback";
import { DataSelect } from "../select/DataSelect";
import { SqlQueryEditor } from "../workspace-query/editor/SqlQueryEditor";
import css from "../workspace-layout/workspace.module.css";
import local from "./view-dialog.module.css";
export function CreateViewDialog({ dataset, ru, onClose, onSaved }: { dataset: WorkspaceDataset; ru: boolean; onClose(): void; onSaved(value: WorkspaceDataset): void }) {
  const feature = useTestData(), command = useDataCommand(), [name, setName] = useState("");
  const first = dataset.sources.find(source => source.status === "ACTIVE");
  const [sourceIds, setSourceIds] = useState<readonly string[]>(first ? [first.id] : []);
  const [query, setQuery] = useState(() => defaultSourceQuery(first));
  const needsQuery = sourceIds.some(id => dataset.sources.some(source => source.id === id && (source.kind === "MYSQL" || source.kind === "POSTGRES")));
  const leave = useFormLeave({ name, sourceIds, query }, { busy: command.pending });
  const allowed = Boolean(feature?.workspace && feature.permissions.update && dataset.status === "ACTIVE");
  async function save() {
    if (!allowed || !name.trim() || !sourceIds.length || !query.trim()) return;
    const draft = { name: name.trim(), sourceIds, query };
    const result = await command.execute((signal, key) => feature!.workspace!.saveView(dataset, draft, null, key, signal), JSON.stringify([dataset.id, dataset.revision, draft]));
    if (result.ok) { leave.release(); onSaved(result.value); }
  }
  return <DataModal panelClassName={local.dialog} title={ru ? "Создать представление" : "Create view"} onClose={() => leave.close(onClose)}>
    <form className={local.form} onSubmit={event => { event.preventDefault(); void save(); }}>
      <WorkspaceTextField label={ru ? "Название представления" : "View name"} ariaLabel="View name" placeholder="e.g. active_users" value={name} onValueChange={setName} maxLength={120} required disabled={command.pending || !allowed} />
      <div className={css.field}><span className={css.fieldLabel}>{ru ? "Источники" : "Sources"}</span><DataSelect aria-label="View sources" placeholder={ru ? "Выберите источники" : "Select sources"} selectionMode="multiple" selectedKeys={new Set(sourceIds)} isDisabled={command.pending || !allowed}
        onSelectionChange={keys => { const ids = Array.from(keys).map(String); setSourceIds(ids); setQuery(defaultSourceQuery(dataset.sources.find(source => source.id === ids[0]))); }}>{dataset.sources.filter(source => source.status === "ACTIVE").map(source => <SelectItem key={source.id}>{source.name}</SelectItem>)}</DataSelect></div>
      {needsQuery && <div className={local.query}><span className={css.fieldLabel}>{ru ? "SQL-запрос" : "SQL query"}</span><SqlQueryEditor value={query} onChange={setQuery} onRun={() => {}} disabled={command.pending || !allowed} label={ru ? "SQL представления" : "View SQL"} /></div>}
      <DataFeedback error={command.error} ru={ru} />
      <div className={local.actions}><Button type="button" disableRipple className={css.quiet} isDisabled={command.pending} onPress={() => leave.close(onClose)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="submit" disableRipple className={css.primary} isLoading={command.pending} isDisabled={!allowed || !name.trim() || !sourceIds.length || !query.trim()}>{ru ? "Создать" : "Create view"}</Button></div>
    </form>
  </DataModal>;
}
