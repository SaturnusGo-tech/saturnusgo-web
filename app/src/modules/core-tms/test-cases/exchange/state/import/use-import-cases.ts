import type { SaveImportSource } from "../../library/model/import-file";
import { useExternalImport } from "../normalization/use-external-import";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { importProjectCases } from "../../application/import-project-cases";
import { buildImportPlan } from "../../application/preview/build-import-plan";
import { prepareImportFolders } from "../../data/folders/prepare-import-folders";
import type { TestCaseExchangeDocument } from "../../model/test-case-exchange";
import { parseTestCaseExchange } from "../../validation/parse-test-case-exchange";
import { decodeImportFile } from "../../application/source/decode-import-file";
import { importFailureMessage } from "../../localization/import-error";
import { useImportTarget } from "./use-import-target";

type Phase = "loading" | "idle" | "reading" | "ready" | "saving" | "converting" | "folders" | "importing" | "partial" | "success" | "stopped";
export function useImportCases(props: Readonly<{ project: Project; folders?: readonly RepositoryFolder[];
  locale?: "ru" | "en"; workspaceId?: string; initialFolderId?: string | null; onImported: (projectId?: string) => Promise<unknown>; saveSource: SaveImportSource }>) {
  const http = useTmsHttpClient();
  const target = useImportTarget(http, props);
  const [phase, setPhase] = useState<Phase>("idle"), [error, setError] = useState("");
  const [document, setDocument] = useState<TestCaseExchangeDocument | null>(null);
  const [fileName, setFileName] = useState("");
  const [completed, setCompleted] = useState(0), [attempted, setAttempted] = useState(0);
  const [failed, setFailed] = useState<readonly { sourceKey: string; message: string }[]>([]);
  const [locked, setLocked] = useState(false);
  const alive = useRef(true), generation = useRef(0), scopeGeneration = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const sourceFile = useRef<File | null>(null), rawSource = useRef<unknown>(undefined);
  const operation = useRef({ preparing: false, committing: false, locked: false, finished: false, successful: [] as readonly number[] });
  const external = useExternalImport(http, props.project, props.locale ?? "ru", []);
  const imported = useRef(props.onImported); imported.current = props.onImported;
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; controller.current?.abort(); generation.current++; scopeGeneration.current++; };
  }, []);
  useEffect(() => {
    controller.current?.abort(); generation.current++; scopeGeneration.current++;
    sourceFile.current = null; rawSource.current = undefined; external.reset();
    operation.current = { preparing: false, committing: false, locked: false, finished: false, successful: [] };
    setLocked(false); setCompleted(0); setAttempted(0); setFailed([]); setFileName("");
    setPhase("idle"); setError(""); setDocument(null);
  }, [http, props.project.id, props.workspaceId]);
  const sourcePreview = useMemo(() => {
    try { return { plan: document ? buildImportPlan(document, "/", []) : null, message: "" }; }
    catch (failure) { return { plan: null, message: failure instanceof Error ? failure.message : "Invalid folder structure." }; }
  }, [document]);
  const preview = useMemo(() => {
    try { return { plan: document && target.context ? buildImportPlan(document, target.destination, target.context.folders) : null, message: "" }; }
    catch (failure) { return { plan: null, message: failure instanceof Error ? failure.message : "Invalid folder structure." }; }
  }, [document, target.destination, target.context]);
  async function prepare(file: File | null | undefined, retry = false) {
    if (!file || !alive.current || !target.isScopeCurrent() || operation.current.locked || operation.current.committing || (operation.current.preparing && file === sourceFile.current)) return;
    controller.current?.abort();
    const token = ++generation.current, abort = new AbortController(); controller.current = abort;
    const current = () => alive.current && generation.current === token && target.isScopeCurrent();
    if (!retry || file !== sourceFile.current) { rawSource.current = undefined; external.reset(); }
    sourceFile.current = file; operation.current.preparing = true; operation.current.successful = [];
    setDocument(null); setFileName(file.name); setError(""); setFailed([]); setCompleted(0); setAttempted(0); setPhase("reading");
    try {
      let ready: TestCaseExchangeDocument | null = null;
      if (rawSource.current === undefined) {
        const decoded = await decodeImportFile(file); abort.signal.throwIfAborted();
        if (!current()) return;
        const raw = decoded.source;
        const schema = typeof raw === "object" && raw !== null && "schemaVersion" in raw ? raw.schemaVersion : null;
        if (typeof schema === "string" && schema.startsWith("saturnusgo.tms.test-cases.")
          && schema !== "saturnusgo.tms.test-cases.v1" && schema !== "saturnusgo.tms.test-cases.v2") {
          throw new Error(props.locale === "ru" ? "Эта версия экспорта Falcon пока не поддерживается." : "This Falcon export version is not supported.");
        }
        if (schema === "saturnusgo.tms.test-cases.v1" || schema === "saturnusgo.tms.test-cases.v2") ready = parseTestCaseExchange(decoded.nativeText ?? JSON.stringify(raw));
        else { rawSource.current = raw; external.reset(raw); }
      }
      if (!ready) { setPhase("converting"); ready = await external.convert(abort.signal); }
      abort.signal.throwIfAborted();
      if (current()) { setDocument(ready); setPhase("ready"); }
    } catch (failure) {
      if (current()) { setPhase("idle"); setError(abort.signal.aborted
        ? (props.locale === "ru" ? "Подготовка остановлена. Повторите попытку или выберите другой файл." : "Preparation stopped. Retry or choose another file.")
        : importFailureMessage(failure, props.locale ?? "ru")); }
    } finally { if (current()) operation.current.preparing = false; }
  }
  async function start() {
    const context = target.context, file = sourceFile.current, project = target.targetProject;
    if (!file || !document || !context || !target.isCurrent() || target.loadingTarget || operation.current.preparing || operation.current.committing || operation.current.finished || phase === "success") return;
    const token = scopeGeneration.current, abort = new AbortController();
    const current = () => alive.current && token === scopeGeneration.current && target.isCurrent();
    controller.current = abort; operation.current.committing = true; setError(""); setFailed([]);
    let changed = false;
    try {
      const plan = buildImportPlan(document, target.destination, context.folders);
      if (!document.testCases.length && !plan.folders.length) throw new Error(props.locale === "ru" ? "В файле нет кейсов или папок." : "No cases or folders found.");
      operation.current.locked = true; setLocked(true); setPhase("saving");
      const folderId = context.folders.find(folder => folder.path === target.destination)?.id ?? null;
      await props.saveSource(file, context.scope, folderId, abort.signal); abort.signal.throwIfAborted();
      if (!current()) return;
      setPhase("folders");
      const known = await prepareImportFolders(http, context.scope, plan, context.folders, abort.signal, folders => {
        changed = true; if (current()) target.setContext({ ...context, folders });
      });
      if (!current()) return;
      target.setContext({ ...context, folders: known }); setPhase("importing");
      const result = await importProjectCases(http, project.id, plan.document, progress => {
        if (current()) { setCompleted(progress.completed); setAttempted(progress.attempted); }
      }, { signal: abort.signal, successfulIndices: operation.current.successful });
      changed = true;
      if (current()) {
        operation.current.successful = result.successfulIndices;
        operation.current.finished = !result.cancelled && !result.failed.length;
        setCompleted(result.completed); setAttempted(result.attempted); setFailed(result.failed);
        setPhase(result.cancelled ? "stopped" : result.failed.length ? "partial" : "success");
      }
    } catch (failure) {
      if (current()) {
        setPhase(changed || operation.current.successful.length ? (abort.signal.aborted ? "stopped" : "partial") : "ready");
        setError(abort.signal.aborted ? "" : importFailureMessage(failure, props.locale ?? "ru"));
      }
    } finally {
      if (current()) {
        operation.current.committing = false;
        if (changed || abort.signal.aborted) try { await imported.current(project.id); }
        catch (failure) { if (current()) setError(failure instanceof Error ? failure.message : "Refresh failed."); }
      }
    }
  }
  const preparing = phase === "reading" || phase === "converting" || external.busy;
  const committing = phase === "saving" || phase === "folders" || phase === "importing";
  return { context: target.context, targetProject: target.targetProject, loadingTarget: target.loadingTarget,
    phase: target.loadingTarget && !preparing && !committing ? "loading" as const : phase,
    external, error: error || target.error || sourcePreview.message || preview.message, document, fileName,
    destination: target.destination, setDestination: (path: string) => { if (!operation.current.locked) target.setDestination(path); },
    completed, attempted, failed, locked, plan: preview.plan, sourcePlan: sourcePreview.plan, preparing, committing, busy: preparing || committing,
    selectFile: (file: File | undefined) => prepare(file), prepareAgain: () => prepare(sourceFile.current, true), start,
    selectProject: (project: Project) => { if (operation.current.locked || operation.current.committing) return Promise.resolve(); setError(""); return target.selectProject(project); },
    stop: () => { controller.current?.abort(); external.stop();
      if (operation.current.preparing) { generation.current++; operation.current.preparing = false; setPhase("idle");
        setError(props.locale === "ru" ? "Подготовка остановлена. Повторите попытку или выберите другой файл." : "Preparation stopped. Retry or choose another file."); } },
    retryContext: () => operation.current.locked ? Promise.resolve() : target.retryContext() };
}
