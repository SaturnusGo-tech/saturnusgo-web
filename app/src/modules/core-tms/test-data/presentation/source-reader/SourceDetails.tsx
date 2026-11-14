import { Button } from "@heroui/react";
import { Archive, ChevronRight, FileSpreadsheet, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import { defaultSourceQuery } from "../../application/workspace-query/default-source-query";
import type { DataSource } from "../../model/workspace/data-workspace";
import { DataFeedback } from "../shared/DataFeedback";
import { DataModal } from "../shared/DataModal";
import { SqlQueryPanel } from "../workspace-query/SqlQueryPanel";
import css from "../workspace-layout/workspace.module.css";
import detail from "./source-reader.module.css";

export function SourceDetails({ source, datasetName, ru, onClose, onUpdated }: { source: DataSource; datasetName?: string; ru: boolean; onClose(): void; onUpdated(): void }) {
  const feature = useTestData(), command = useDataCommand(), [confirm, setConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0), [query, setQuery] = useState(() => defaultSourceQuery(source));
  const updatedAt = Date.parse(source.updatedAt), refreshed = Number.isFinite(updatedAt) ? new Intl.DateTimeFormat(ru ? "ru-RU" : "en-GB", { dateStyle: "short", timeStyle: "medium" }).format(updatedAt) : "";
  async function archive() {
    if (!feature?.workspace || !feature.permissions.archive) return;
    const result = await command.execute((signal, key) => feature.workspace!.archiveSource(source, key, signal), `${source.id}:${source.revision}`);
    if (result.ok) { setConfirm(false); onUpdated(); }
  }
  const fileSource = source.kind === "FILE" || source.kind === "POSTMAN";
  return <section className={css.pane} data-source-detail={source.id}>
    <header className={detail.toolbar}><nav className={detail.breadcrumbs} aria-label={ru ? "Расположение источника" : "Source location"}>
      {datasetName && <><Button type="button" disableRipple className={detail.back} onPress={onClose}>{datasetName}</Button><ChevronRight size={12} /></>}
      <span>{source.name}</span></nav><div className={detail.actions}>
      {refreshed && <span className={detail.updated}>{ru ? "Обновлено:" : "Last refreshed:"} {refreshed}</span>}
      {source.status === "ACTIVE" && Boolean(defaultSourceQuery(source)) && <Button type="button" isIconOnly disableRipple className={css.close} aria-label={ru ? "Обновить источник" : "Refresh source"} onPress={() => setRefreshKey(value => value + 1)}><RefreshCw size={14} /></Button>}
      {feature?.permissions.archive && source.status === "ACTIVE" && <Button type="button" isIconOnly disableRipple className={css.close} aria-label={ru ? "Архивировать источник" : "Archive source"} onPress={() => setConfirm(true)}><Archive size={14} /></Button>}
      <Button type="button" isIconOnly disableRipple className={css.close} aria-label="Close source" onPress={onClose}><X size={16} /></Button></div></header>
    <div className={css.dataBody}><div className={detail.file}>
      <span className={detail.label}>{fileSource ? (ru ? "Файл" : "File") : (ru ? "Подключение" : "Connection")}</span>
      <div className={detail.fileRow}><FileSpreadsheet size={14} /><span>{fileSource ? source.name : `${source.connection?.host ?? source.name}${source.connection?.database ? ` / ${source.connection.database}` : ""}`}</span></div>
      <DataFeedback error={command.error} ru={ru} /></div>
      <SqlQueryPanel key={source.id} sourceIds={source.status === "ACTIVE" ? [source.id] : []} query={query} onChange={setQuery} ru={ru}
        autoRun={Boolean(defaultSourceQuery(source))} refreshKey={refreshKey}
        emptyMessage={fileSource ? undefined : (ru ? "Укажите таблицу в SQL-запросе, чтобы посмотреть данные." : "Specify a table in the SQL query to explore its data.")} />
    </div>
    {confirm && <DataModal title={ru ? "Архивировать источник?" : "Archive source?"} onClose={() => { if (!command.pending) setConfirm(false); }}>
      <p className={css.subtitle}>{ru ? "Связанные датасеты сохранят ссылки. Новые запросы к архивированному источнику будут недоступны." : "Dataset links remain intact. Queries against this archived source will be unavailable."}</p>
      <div className={css.actions}><Button type="button" disableRipple className={css.quiet} isDisabled={command.pending} onPress={() => setConfirm(false)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="button" disableRipple className={css.primary} isLoading={command.pending} onPress={() => void archive()}>{ru ? "Архивировать" : "Archive"}</Button></div></DataModal>}
  </section>;
}
