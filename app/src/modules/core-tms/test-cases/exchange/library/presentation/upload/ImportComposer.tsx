import { Button } from "@heroui/react";
import { FileUp, FolderInput } from "lucide-react";
import { useRef, useState } from "react";
import { ErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import type { useImportCases } from "../../../state/import/use-import-cases";
import { importCopy } from "../../../localization/import-copy";
import css from "../page/import-page.module.css";

export function ImportComposer({ state, ru }: { state: ReturnType<typeof useImportCases>; ru: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const copy = importCopy[ru ? "ru" : "en"];
  const disabled = state.locked || state.busy;
  return <section className={css.upload} data-dragging={dragging || undefined}
    onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
    onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled) void state.selectFile(event.dataTransfer.files[0]); }}>
    <FolderInput className={css.uploadIcon} size={72} strokeWidth={1} aria-hidden="true" />
    <h2>{ru ? "Начните с файла экспорта" : "Start with an export file"}</h2>
    <p>{ru ? "Перенесите тест-кейсы и чек-листы вместе со структурой папок."
      : "Bring your test cases, checklists and folder structure into Falcon."}</p>
    <input ref={input} className={css.hidden} type="file" hidden tabIndex={-1}
      accept=".json,.csv,.tsv,.xml,.xlsx,.xls,application/json,text/csv,text/tab-separated-values,application/xml,text/xml,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      aria-label={copy.choose} disabled={disabled} onChange={event => { void state.selectFile(event.target.files?.[0]); event.target.value = ""; }} />
    <Button className={css.primary} radius="full" isDisabled={disabled} onPress={() => input.current?.click()}
      startContent={<FileUp size={17} aria-hidden="true" />}>{copy.title}</Button>
    <span className={css.formats}>{copy.format}</span>
    <span className={css.dropHint}>{ru ? "Можно просто перетащить файл сюда" : "Or drop a file anywhere here"}</span>
    {state.external.active && !state.document && state.error && <Button className={css.quiet} variant="light" radius="full" onPress={() => void state.prepareAgain()}>
      {ru ? "Продолжить подготовку" : "Continue preparation"}</Button>}
    <ErrorToast message={state.error} />
  </section>;
}
