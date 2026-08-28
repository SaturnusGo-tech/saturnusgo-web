import { Check, Play, Search } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Bootstrap, Project, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { createRun } from "../../../application/runs/createRun";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { formatCount } from "../../../localization/format/count";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { getRunDialogCopy } from "./copy";
import styles from "../../../tms.module.css";

export function RunDialog({ data, project, selectedSuiteId, presetCaseIds, offline, onClose, onCreated }: { data: Bootstrap; project: Project; selectedSuiteId: string; presetCaseIds: string[]; offline: boolean; onClose: () => void; onCreated: (run: TestRunSummary) => void }) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const copy = getRunDialogCopy(locale);
  const caseCount = (count: number) => formatCount(locale, count, ["case", "cases"], ["тест-кейс", "тест-кейса", "тест-кейсов"]);
  const environments = data.environments.filter((item) => item.projectId === project.id && item.status !== "archived");
  const suites = data.suites.filter((item) => item.projectId === project.id && item.status === "active");
  const cases = data.testCases.filter((item) => item.projectId === project.id && !item.archivedAt);
  const initialSuite = suites.find((item) => item.id === selectedSuiteId);
  const initialIds = presetCaseIds.filter((id) => cases.some((item) => item.id === id));
  const [suiteId, setSuiteId] = useState(initialSuite?.id ?? "");
  const [caseIds, setCaseIds] = useState<string[]>(initialIds);
  const [query, setQuery] = useState("");
  const [environmentId, setEnvironmentId] = useState(environments.find((item) => item.isDefault)?.id ?? environments[0]?.id ?? "");
  const [type, setType] = useState<TestRunSummary["type"]>(presetCaseIds.length ? "ad_hoc" : "smoke");
  const [name, setName] = useState(`${project.name} ${presetCaseIds.length ? copy.integrationName : copy.smokeName} · ${copy.localBuild}`);
  const [build, setBuild] = useState("local-current");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<PendingOperation | null>(null);
  const visibleCases = cases.filter((item) => `${item.key} ${item.folderPath} ${item.title} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const selectedCases = cases.filter((item) => caseIds.includes(item.id));
  const selectedSuite = suites.find((item) => item.id === suiteId);
  const selectionCount = selectedSuite?.caseCount ?? caseIds.length;
  const hasSelection = selectedSuite?.type === "dynamic" || selectionCount > 0;
  const selectionLabel = selectedSuite?.type === "dynamic" ? selectedSuite.name : caseCount(selectionCount);
  function selectSuite(nextSuiteId: string) { setSuiteId(nextSuiteId); setCaseIds([]); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !hasSelection) return;
    const suite = suites.find((item) => item.id === suiteId);
    const environment = environments.find((item) => item.id === environmentId);
    if (!environment) return;
    setSubmitting(true); setError("");
    const signature = JSON.stringify({ projectId: project.id, environmentId: environment.id, suiteId: suite?.id ?? null, caseIds: suite ? [] : caseIds, name, type, build });
    operation.current = resolvePendingOperation(operation.current, signature);
    const result = await createRun({ http, project, environment, suite, caseIds, name, type, build, offline, operationKey: operation.current.key });
    if (!result.ok) { setError(formatTmsMutationFailure(result.failure, copy.createError)); setSubmitting(false); return; }
    onCreated(result.run);
  }
  return <Modal title={copy.title} subtitle={`${project.name} · ${selectionLabel}`} onClose={onClose} wide drawer>
    <form onSubmit={submit} className={`${styles.drawerForm} ${styles.productionDrawerForm}`}>
      <div className={styles.drawerBody}>
        <section className={styles.drawerSection}>
          <div className={styles.drawerSectionHeading}><strong>{copy.executionScope}</strong><span>{copy.repositoryHint}</span></div>
          <div className={styles.formGrid}><Field label={copy.startFromSuite} wide><select value={suiteId} onChange={(event) => selectSuite(event.target.value)}><option value="">{copy.customSelection}</option>{suites.map((suite) => <option value={suite.id} key={suite.id}>{suite.name}{suite.type === "static" ? ` · ${caseCount(suite.caseCount)}` : ""}</option>)}</select></Field></div>
          {!suiteId && <><div className={styles.drawerSelectionBar}><strong>{copy.selected}: {caseCount(caseIds.length)}</strong><span><button type="button" onClick={() => setCaseIds(Array.from(new Set([...caseIds, ...visibleCases.map((item) => item.id)])))}>{copy.selectVisible}</button><button type="button" onClick={() => setCaseIds((current) => current.filter((id) => !visibleCases.some((item) => item.id === id)))}>{copy.clearVisible}</button></span></div><label className={styles.searchField}><Search size={15} /><input aria-label={copy.searchAria} autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label><div className={`${styles.casePicker} ${styles.compactCasePicker}`} data-testid="run-case-picker">{visibleCases.map((item) => { const checked = caseIds.includes(item.id); return <label key={item.id} className={checked ? styles.casePickerSelected : ""}><input type="checkbox" checked={checked} onChange={() => setCaseIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} /><span><small>{item.key} · {item.folderPath}</small><strong>{item.title}</strong></span></label>; })}{visibleCases.length === 0 && <div className={styles.compactPickerEmpty}>{copy.noMatching}</div>}</div></>}
          {suiteId && selectedSuite && <div className={styles.drawerSummaryLine}><Check size={14} /><span><strong>{selectedSuite.key} · {selectedSuite.name}</strong><small>{selectionLabel}</small></span></div>}
        </section>
        <section className={styles.drawerSection}>
          <div className={styles.drawerSectionHeading}><strong>{copy.configureStep}</strong></div>
          {environments.length === 0 ? <div className={styles.blockerNotice}><span><strong>{copy.environmentRequired}</strong><small>{copy.environmentRequiredHint}</small></span></div> : <div className={styles.formGrid}>
            <Field label={copy.name} wide><input required value={name} onChange={(event) => setName(event.target.value)} /></Field>
            <Field label={copy.type}><select value={type} onChange={(event) => setType(event.target.value as TestRunSummary["type"])}><option value="smoke">{copy.smoke}</option><option value="regression">{copy.regression}</option><option value="acceptance">{copy.acceptance}</option><option value="ad_hoc">{copy.adHoc}</option></select></Field>
            <Field label={copy.build}><input value={build} onChange={(event) => setBuild(event.target.value)} /></Field>
            <Field label={copy.environment} wide><select value={environmentId} onChange={(event) => setEnvironmentId(event.target.value)}>{environments.map((environment) => <option value={environment.id} key={environment.id}>{environment.name} · {environment.baseUrl}</option>)}</select></Field>
          </div>}
          {selectedCases.length > 0 && <div className={styles.drawerSummaryLine}><Check size={14} /><span><strong>{selectionLabel}</strong><small>{selectedCases.slice(0, 3).map((item) => item.key).join(", ")}{selectedCases.length > 3 ? ` +${selectedCases.length - 3}` : ""}</small></span></div>}
          {error && <FormError message={error} />}
        </section>
      </div>
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} data-testid="start-run" disabled={submitting || !environmentId || !name.trim() || !hasSelection}><Play size={16} />{submitting ? copy.starting : copy.title}</button></div>
    </form>
  </Modal>;
}
