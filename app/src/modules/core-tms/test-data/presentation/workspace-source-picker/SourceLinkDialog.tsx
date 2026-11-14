import { Button } from "@heroui/react";
import { Database, FileSpreadsheet, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { IntegrationInput } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { requestAuthoringLeave } from "../../../authoring/leave/application/authoring-leave";
import local from "./source-picker.module.css";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCatalog } from "../../application/catalog/useDataCatalog";
import { useDataCommand } from "../../application/command/useDataCommand";
import type { DataSource, WorkspaceDataset } from "../../model/workspace/data-workspace";
import { DataModal } from "../shared/DataModal";
import { DataFeedback } from "../shared/DataFeedback";
import { SourceEditor } from "../source-editor/SourceEditor";
import css from "../workspace-layout/workspace.module.css";
export function SourceLinkDialog({ dataset, ru, onClose, onLinked, initialKind }: { dataset: WorkspaceDataset; ru: boolean; onClose(): void; onLinked(value: WorkspaceDataset): void; initialKind?: DataSource["kind"] }) {
  const feature = useTestData(), command = useDataCommand(), [creating, setCreating] = useState(Boolean(initialKind));
  const load = useCallback((search: string, cursor: string | null, signal: AbortSignal) => feature!.workspace!.sources(search, cursor, signal), [feature]);
  const catalog = useDataCatalog<DataSource>(load);
  async function link(source: DataSource) {
    if (!feature?.workspace || !feature.permissions.update) return;
    const result = await command.execute((signal, key) => feature.workspace!.linkSource(dataset, source.id, key, signal), `${dataset.id}:${dataset.revision}:${source.id}`);
    if (result.ok) onLinked(result.value);
  }
  return <DataModal wide title={creating ? (ru ? "Новый источник" : "New data source") : (ru ? "Добавить источник" : "Add source")} onClose={() => { if (!command.pending) { if (creating) void requestAuthoringLeave(initialKind ? onClose : () => setCreating(false)); else onClose(); } }}>
    <div className={local.content}>{creating ? <div className={local.editor}><SourceEditor inline initialKind={initialKind} ru={ru} onClose={initialKind ? onClose : () => setCreating(false)} onSaved={source => { setCreating(false); catalog.refresh(); void link(source); }} /></div> : <div className={`${css.form} ${local.catalog}`}>
      <IntegrationInput aria-label={ru ? "Найти источник" : "Find a source"} placeholder={ru ? "Найти источник" : "Find a source"} value={catalog.search} onValueChange={catalog.setSearch} isDisabled={command.pending} />
      <DataFeedback loading={catalog.loading} error={catalog.error || command.error} ru={ru} retry={catalog.refresh} />
      <div className={css.rows}>{catalog.items.map(source => <Button key={source.id} type="button" disableRipple className={css.row}
        isDisabled={command.pending || dataset.sources.some(item => item.id === source.id)} onPress={() => void link(source)}>
        {source.kind === "FILE" ? <FileSpreadsheet size={17} /> : <Database size={17} />}<span>{source.name}</span>
        <small>{dataset.sources.some(item => item.id === source.id) ? (ru ? "Добавлен" : "Added") : source.kind === "POSTMAN" ? "Postman" : source.kind}</small></Button>)}</div>
      {!catalog.loading && !catalog.error && !catalog.items.length && <p className={css.empty}>{ru ? "Источники не найдены" : "No sources found"}</p>}
      <div className={css.actions}>{catalog.cursor && <Button type="button" disableRipple className={css.quiet} isLoading={catalog.pending} onPress={catalog.more}>{ru ? "Ещё" : "Load more"}</Button>}
        {feature?.permissions.create && <Button type="button" disableRipple className={css.quiet} startContent={<Plus size={16} />} isDisabled={command.pending} onPress={() => setCreating(true)}>{ru ? "Новый источник" : "New source"}</Button>}</div>
    </div>}</div>
  </DataModal>;
}
