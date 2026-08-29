import { Download, FileJson, LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { Project } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { exportProjectCases } from "../../test-cases/exchange/application/export-project-cases";
import { importProjectCases } from "../../test-cases/exchange/application/import-project-cases";
import {
  TEST_CASE_IMPORT_BYTES,
  type TestCaseExchangeDocument,
} from "../../test-cases/exchange/model/test-case-exchange";
import { parseTestCaseExchange } from "../../test-cases/exchange/validation/parse-test-case-exchange";
import styles from "../../tms.module.css";

type ProjectCaseExchangeProps = Readonly<{
  enabled: boolean;
  project: Project;
  onImported: () => Promise<unknown>;
}>;

type ExchangeState = Readonly<{
  kind: "idle" | "ready" | "exporting" | "importing" | "success" | "error";
  message: string;
  completed: number;
  total: number;
}>;

const idle: ExchangeState = { kind: "idle", message: "", completed: 0, total: 0 };

function save(document: TestCaseExchangeDocument, project: Project) {
  const blob = new Blob([`${JSON.stringify(document, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.key.toLowerCase()}-test-cases.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProjectCaseExchange({ enabled, project, onImported }: ProjectCaseExchangeProps) {
  const http = useTmsHttpClient();
  const { t } = useTmsLocale();
  const input = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<TestCaseExchangeDocument | null>(null);
  const [state, setState] = useState<ExchangeState>(idle);
  const busy = state.kind === "exporting" || state.kind === "importing";

  async function selectFile(file: File | undefined) {
    setDocument(null);
    if (!file) return setState(idle);
    try {
      if (file.size > TEST_CASE_IMPORT_BYTES) throw new Error(t("config.exchangeFileTooLarge"));
      const parsed = parseTestCaseExchange(await file.text());
      setDocument(parsed);
      setState({ kind: "ready", message: t("config.exchangeReady", { count: parsed.testCases.length }), completed: 0, total: parsed.testCases.length });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : t("config.exchangeInvalid"), completed: 0, total: 0 });
    }
  }

  async function exportCases() {
    setState({ kind: "exporting", message: t("config.exchangeExporting"), completed: 0, total: 0 });
    try {
      const exported = await exportProjectCases(http, project);
      save(exported, project);
      setState({ kind: "success", message: t("config.exchangeExported", { count: exported.testCases.length }), completed: exported.testCases.length, total: exported.testCases.length });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : t("config.exchangeFailed"), completed: 0, total: 0 });
    }
  }

  async function importCases() {
    if (!document) return;
    setState({ kind: "importing", message: t("config.exchangeImporting"), completed: 0, total: document.testCases.length });
    const result = await importProjectCases(http, project.id, document, ({ completed, total }) => {
      setState({ kind: "importing", message: t("config.exchangeProgress", { completed, total }), completed, total });
    });
    await onImported();
    if (result.failed.length) {
      const first = result.failed[0];
      setState({ kind: "error", message: t("config.exchangePartial", { failed: result.failed.length, key: first.sourceKey }), completed: result.completed, total: document.testCases.length });
      return;
    }
    setDocument(null);
    if (input.current) input.current.value = "";
    setState({ kind: "success", message: t("config.exchangeImported", { count: result.completed }), completed: result.completed, total: result.completed });
  }

  return <section className={styles.caseExchange} aria-labelledby="case-exchange-title">
    <div className={styles.caseExchangeHeading}>
      <FileJson size={20} />
      <span><strong id="case-exchange-title">{t("config.exchangeTitle")}</strong><small>{t("config.exchangeHint")}</small></span>
    </div>
    <div className={styles.caseExchangeActions}>
      <button className={styles.secondaryButton} disabled={!enabled || busy} onClick={() => void exportCases()}>{state.kind === "exporting" ? <LoaderCircle className={styles.spin} size={16} /> : <Download size={16} />} {t("config.exchangeExport")}</button>
      <input ref={input} className={styles.visuallyHidden} type="file" accept="application/json,.json" onChange={(event) => void selectFile(event.target.files?.[0])} />
      <button className={styles.secondaryButton} disabled={!enabled || busy} onClick={() => input.current?.click()}><Upload size={16} /> {t("config.exchangeChoose")}</button>
      <button className={styles.primaryButton} disabled={!enabled || busy || !document} onClick={() => void importCases()}>{state.kind === "importing" ? <LoaderCircle className={styles.spin} size={16} /> : <Upload size={16} />} {document ? t("config.exchangeImportCount", { count: document.testCases.length }) : t("config.exchangeImport")}</button>
    </div>
    {state.total > 0 && <progress className={styles.caseExchangeProgress} max={state.total} value={state.completed} aria-label={state.message} />}
    <p className={`${styles.caseExchangeStatus} ${state.kind === "error" ? styles.caseExchangeError : ""}`} aria-live="polite">{state.message || (!enabled ? t("config.exchangeConnectedOnly") : t("config.exchangeFormat"))}</p>
  </section>;
}
