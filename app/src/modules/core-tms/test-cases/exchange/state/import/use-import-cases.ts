import { useExternalImport } from "../normalization/use-external-import";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { importProjectCases } from "../../application/import-project-cases";
import { buildImportPlan } from "../../application/preview/build-import-plan";
import { loadImportContext } from "../../data/context/import-context";
import { prepareImportFolders } from "../../data/folders/prepare-import-folders";
import { TEST_CASE_IMPORT_BYTES, type TestCaseExchangeDocument } from "../../model/test-case-exchange";
import { parseTestCaseExchange } from "../../validation/parse-test-case-exchange";

type Phase = "loading" | "idle" | "reading" | "ready" | "converting" | "folders" | "importing" | "partial" | "success" | "stopped";
type Context = Awaited<ReturnType<typeof loadImportContext>>;
export function useImportCases(props: Readonly<{ project: Project; folders?: readonly RepositoryFolder[];
  locale?: "ru" | "en"; workspaceId?: string; initialFolderId?: string | null; onImported: () => Promise<unknown> }>) {
  const http = useTmsHttpClient();
  const [context, setContext] = useState<Context | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [document, setDocument] = useState<TestCaseExchangeDocument | null>(null);
  const [fileName, setFileName] = useState("");
  const [destination, setDestination] = useState("/");
  const [completed, setCompleted] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [failed, setFailed] = useState<readonly { sourceKey: string; message: string }[]>([]);
  const [locked, setLocked] = useState(false);
  const [reload, setReload] = useState(0);
  const alive = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const fileGeneration = useRef(0);
  const scopeGeneration = useRef(0);
  const successful = useRef<readonly number[]>([]);
  const running = useRef(false);
  const external = useExternalImport(http, props.project, props.locale ?? "ru", context?.folders.map(f => f.path) ?? []);
  const imported = useRef(props.onImported);
  imported.current = props.onImported;
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; controller.current?.abort(); fileGeneration.current += 1; };
  }, []);
  useEffect(() => {
    controller.current?.abort();
    scopeGeneration.current += 1; fileGeneration.current += 1;
    successful.current = []; running.current = false;
    setLocked(false); setCompleted(0); setAttempted(0); setFailed([]);
    const abort = new AbortController();
    controller.current = abort;
    setPhase("loading"); setError(""); setContext(null); setDocument(null);
    const workspaceId = props.workspaceId ?? props.folders?.[0]?.workspaceId;
    loadImportContext(http, props.project.id, abort.signal,
      workspaceId ? { workspaceId, folders: props.folders } : undefined).then((value) => {
      if (abort.signal.aborted) return;
      setContext(value);
      const initial = value.folders.find((folder) => folder.id === props.initialFolderId && !folder.archivedAt);
      setDestination(initial?.path ?? "/"); setPhase("idle");
    }).catch((failure: unknown) => {
      if (!abort.signal.aborted) { setError(failure instanceof Error ? failure.message : "Unable to load folders."); setPhase("idle"); }
    });
    return () => abort.abort();
  }, [http, props.project.id, props.workspaceId, reload]);
  const preview = useMemo(() => {
    if (!document || !context) return { plan: null, message: "" };
    try { return { plan: buildImportPlan(document, destination, context.folders), message: "" }; }
    catch (failure) { return { plan: null, message: failure instanceof Error ? failure.message : "Invalid folder structure." }; }
  }, [document, destination, context]);
  async function selectFile(file: File | undefined) {
    if (!file || locked || running.current) return;
    const generation = ++fileGeneration.current;
    external.reset();
    setDocument(null); setFileName(file.name); setError(""); setFailed([]); setPhase("reading");
    setCompleted(0); setAttempted(0); successful.current = [];
    try {
      if (file.size > TEST_CASE_IMPORT_BYTES) throw new Error("JSON ≤ 5 MB");
      const text = await file.text();
      const raw: unknown = JSON.parse(text.replace(/^\uFEFF/, ""));
      if (!alive.current || generation !== fileGeneration.current) return;
      const schema = typeof raw === "object" && raw !== null && "schemaVersion" in raw ? raw.schemaVersion : null;
      if (schema !== "saturnusgo.tms.test-cases.v1" && schema !== "saturnusgo.tms.test-cases.v2") {
        external.reset(raw); setPhase("idle"); return;
      }
      const parsed = parseTestCaseExchange(text);
      if (!alive.current || generation !== fileGeneration.current) return;
      setDocument(parsed); setPhase("ready");
    } catch (failure) {
      if (alive.current && generation === fileGeneration.current) {
        setError(failure instanceof Error ? failure.message : "Invalid JSON."); setPhase("idle");
      }
    }
  }
  async function start() {
    if (!context || running.current || phase === "reading" || (!document && !external.active)) return;
    const generation = scopeGeneration.current;
    const current = () => alive.current && generation === scopeGeneration.current;
    const abort = new AbortController();
    controller.current = abort; running.current = true;
    setError(""); setFailed([]);
    let changed = false;
    try {
      let ready = document;
      if (!ready) {
        setPhase("converting");
        ready = await external.convert(abort.signal);
        abort.signal.throwIfAborted();
        if (!current()) return;
        setDocument(ready);
      }
      const plan = buildImportPlan(ready, destination, context.folders);
      if (!ready.testCases.length && !plan.folders.length) throw new Error(props.locale === "ru" ? "В файле нет кейсов или папок." : "No cases or folders found.");
      setLocked(true); setPhase("folders");
      const known = await prepareImportFolders(http, context.scope, plan, context.folders, abort.signal, (folders) => {
        changed = true;
        if (current()) setContext({ ...context, folders });
      });
      if (current()) { setContext({ ...context, folders: known }); setPhase("importing"); }
      const result = await importProjectCases(http, props.project.id, plan.document, (progress) => {
        if (current()) { setCompleted(progress.completed); setAttempted(progress.attempted); }
      }, { signal: abort.signal, successfulIndices: successful.current });
      if (current()) successful.current = result.successfulIndices;
      changed = true;
      if (current()) {
        setCompleted(result.completed); setAttempted(result.attempted); setFailed(result.failed);
        setPhase(result.cancelled ? "stopped" : result.failed.length ? "partial" : "success");
      }
    } catch (failure) {
      if (current()) {
        setPhase(changed || successful.current.length ? (abort.signal.aborted ? "stopped" : "partial") : "ready");
        const code = typeof failure === "object" && failure && "code" in failure ? String(failure.code) : "";
        const message = code.startsWith("IMPORT_") ? (props.locale === "ru"
          ? code === "IMPORT_SOURCE_INVALID" ? "В файле не найдены тест-кейсы. Проверьте содержимое JSON."
            : code === "IMPORT_LIMIT_EXCEEDED" ? "Файл превышает лимит обработки. Разделите его на несколько файлов."
            : "Не удалось обработать файл. Повторите импорт; выбранный файл сохранён."
          : "Could not process this file. Retry the import; your file is retained.")
          : failure instanceof Error ? failure.message : "Import failed.";
        setError(abort.signal.aborted ? "" : message);
      }
    } finally {
      if (generation === scopeGeneration.current) running.current = false;
      if (changed || abort.signal.aborted) {
        try { await imported.current(); }
        catch (failure) { if (current()) setError(failure instanceof Error ? failure.message : "Refresh failed."); }
      }
    }
  }
  return { context, phase, external, error: error || preview.message, document, fileName, destination,
    setDestination, completed, attempted, failed, locked, plan: preview.plan,
    busy: phase === "converting" || external.busy || phase === "folders" || phase === "importing", selectFile, start,
    stop: () => { controller.current?.abort(); external.stop(); }, retryContext: () => setReload((value) => value + 1) };
}
