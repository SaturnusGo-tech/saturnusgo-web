"use client";
import { Button, SelectItem } from "@heroui/react";
import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WorkspaceTextField } from "../workspace-fields/WorkspaceTextField";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import type { DataSource, SourceConnectionDraft } from "../../model/workspace/data-workspace";
import type { SourceImportFile } from "../../model/source-import/source-import-file";
import { ResourceEditorFrame } from "../editor-frame/ResourceEditorFrame";
import { DataFeedback } from "../shared/DataFeedback";
import { DataSelect } from "../select/DataSelect";
import { ConnectionFields, type SourceConnectionFields } from "./connection/ConnectionFields";
import frame from "../editor-frame/resource-editor.module.css";
import css from "../workspace-layout/workspace.module.css";

export function SourceEditor({ ru, onClose, onSaved, inline = false, initialKind = "FILE" }: { ru: boolean; onClose(): void; onSaved(value: DataSource): void; inline?: boolean; initialKind?: DataSource["kind"] }) {
  const feature = useTestData(), command = useDataCommand(), input = useRef<HTMLInputElement>(null), reading = useRef(0), readController = useRef<AbortController | null>(null);
  const [kind, setKind] = useState<DataSource["kind"]>(initialKind), [name, setName] = useState(""), [description, setDescription] = useState("");
  const [connection, setConnection] = useState<SourceConnectionFields>({ host: "", port: initialKind === "MYSQL" ? "3306" : "5432", database: "", username: "", password: "", datasetId: "", region: "us", apiKey: "" });
  const [importFile, setImportFile] = useState<SourceImportFile | null>(null), [sheet, setSheet] = useState(0);
  const [file, setFile] = useState<{ name: string; content: string; format: "CSV" | "JSON" } | null>(null), [fileError, setFileError] = useState(false), [loading, setLoading] = useState(false);
  const leave = useFormLeave({ name, description, kind, host: connection.host, port: connection.port, database: connection.database, username: connection.username, datasetId: connection.datasetId, region: connection.region, fileName: file?.name, sheet }, { busy: command.pending || loading, extraDirty: Boolean(connection.password || connection.apiKey || file) });
  useEffect(() => () => { reading.current++; readController.current?.abort(); }, []);
  const canAuthor = Boolean(feature?.permissions.create && feature.workspace), canConnect = Boolean(canAuthor && feature?.permissions.credentialCreate);
  const canCreate = kind === "FILE" ? canAuthor : canConnect;
  const valid = name.trim() && (kind === "FILE" ? file : kind === "POSTMAN" ? connection.datasetId.trim() && connection.apiKey : connection.host.trim() && connection.database.trim() && connection.username.trim() && connection.password && Number(connection.port) > 0);
  async function chooseFile(next: File | undefined) {
    if (!next) return;
    readController.current?.abort(); const controller = new AbortController(); readController.current = controller;
    const request = ++reading.current; setFile(null); setImportFile(null); setLoading(true); setFileError(false);
    try {
      if (!feature?.workspace) return;
      const parsed = await feature.workspace.readImportFile(next, controller.signal); if (request !== reading.current) return;
      setImportFile(parsed); setSheet(0);
      setFile({ name: next.name, content: parsed.sheets[0].content, format: parsed.format }); if (!name) setName(next.name.replace(/\.(csv|json|xlsx|xls)$/i, ""));
    } catch { if (request === reading.current) setFileError(true); }
    finally { if (request === reading.current) setLoading(false); }
  }
  async function save() {
    if (!canCreate || !valid || !feature?.workspace) return;
    const metadata = { name: name.trim(), description: description.trim() };
    const result = await command.execute((signal, key) => {
      if (kind === "FILE" && file) return feature.workspace!.importSource({ ...metadata, format: file.format, content: file.content, provenance: "FILE" }, key, signal);
      const draft: SourceConnectionDraft = kind === "POSTMAN" ? { ...metadata, kind, connection: { datasetId: connection.datasetId.trim(), region: connection.region, apiKey: connection.apiKey } }
        : { ...metadata, kind: kind === "MYSQL" ? "MYSQL" : "POSTGRES", connection: { host: connection.host.trim(), port: Number(connection.port), database: connection.database.trim(), username: connection.username.trim(), password: connection.password, tls: true } };
      return feature.workspace!.connectSource(draft, key, signal);
    }, JSON.stringify({ kind, name, description, file, connection }));
    if (result.ok) { setConnection(value => ({ ...value, password: "", apiKey: "" })); setFile(null); leave.release(); onSaved(result.value); }
  }
  return <ResourceEditorFrame inline={inline} title={ru ? "Новый источник" : "New data source"} ru={ru} busy={command.pending} onClose={() => leave.close(onClose)}>
    <form className={`${frame.form} ${css.form}`} onSubmit={event => { event.preventDefault(); void save(); }}>
      <div className={frame.body}><div className={frame.fields}>
        <DataFeedback denied={!canCreate} error={command.error} loading={loading} ru={ru} />
        <WorkspaceTextField label={ru ? "Название" : "Name"} ariaLabel="Name" value={name} onValueChange={setName} maxLength={120} required disabled={command.pending || !canAuthor} />
        <WorkspaceTextField multiline label={ru ? "Описание" : "Description"} ariaLabel="Description" value={description} onValueChange={setDescription} placeholder={ru ? "Добавить описание…" : "Add description…"} maxLength={2000} disabled={command.pending || !canAuthor} />
        <div className={css.field}><span className={css.fieldLabel}>{ru ? "Тип источника" : "Source type"}</span><DataSelect aria-label="Source type" selectedKeys={[kind]} disabledKeys={canConnect ? [] : ["POSTMAN", "POSTGRES", "MYSQL"]} isDisabled={command.pending || !canAuthor} onSelectionChange={keys => {
          const next = String(Array.from(keys)[0]) as DataSource["kind"]; readController.current?.abort(); reading.current++; setLoading(false); setFile(null); setImportFile(null); setFileError(false); setKind(next); setConnection(value => ({ ...value, password: "", apiKey: "", port: next === "MYSQL" ? "3306" : "5432" }));
        }}><SelectItem key="FILE">CSV / JSON / Excel</SelectItem><SelectItem key="POSTMAN">Postman Cloud Store</SelectItem><SelectItem key="POSTGRES">PostgreSQL</SelectItem><SelectItem key="MYSQL">MySQL</SelectItem></DataSelect></div>
        {kind === "FILE" ? <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!command.pending && canCreate) void chooseFile(event.dataTransfer.files[0]); }}>
          <input ref={input} hidden type="file" accept=".csv,.json,.xlsx,.xls,text/csv,application/json" aria-label={ru ? "Импортировать файл" : "Import file"} onChange={event => { void chooseFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
          <Button type="button" disableRipple className={css.quiet} startContent={<Upload size={16} />} isDisabled={command.pending || !canCreate} onPress={() => input.current?.click()}>{ru ? "Выбрать файл" : "Choose file"}</Button>
          <p className={css.subtitle}>{file?.name ?? (ru ? "Перетащите CSV, JSON или Excel сюда." : "Drop a CSV, JSON or Excel file here.")}</p>
          {importFile && importFile.sheets.length > 1 && <div className={css.field}><span className={css.fieldLabel}>{ru ? "Лист" : "Worksheet"}</span><DataSelect aria-label="Worksheet" selectedKeys={[String(sheet)]} isDisabled={command.pending} onSelectionChange={keys => { const index = Number(Array.from(keys)[0]); setSheet(index); setFile({ name: importFile.name, format: importFile.format, content: importFile.sheets[index].content }); }}>{importFile.sheets.map((value, index) => <SelectItem key={String(index)}>{value.name}</SelectItem>)}</DataSelect></div>}
          {fileError && <p role="alert" className={css.subtitle}>{ru ? "Не удалось прочитать файл. Выберите CSV, JSON или Excel до 5 МБ." : "Could not read the file. Choose CSV, JSON or Excel up to 5 MB."}</p>}
        </div> : <ConnectionFields kind={kind} value={connection} onChange={setConnection} ru={ru} disabled={command.pending || !canCreate} />}
      </div></div>
      <footer className={frame.footer}><Button type="button" disableRipple className={css.quiet} isDisabled={command.pending} onPress={() => leave.close(onClose)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="submit" disableRipple className={css.primary} isDisabled={!canCreate || !valid || loading} isLoading={command.pending}>{kind === "FILE" ? (ru ? "Импортировать" : "Import") : (ru ? "Подключить" : "Connect")}</Button></footer>
    </form>
  </ResourceEditorFrame>;
}
