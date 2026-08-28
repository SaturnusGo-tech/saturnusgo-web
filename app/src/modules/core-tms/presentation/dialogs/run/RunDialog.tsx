import { Check, ChevronLeft, ChevronRight, FlaskConical, ListChecks, Play, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Bootstrap, Project, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
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
  const minuteCount = (count: number) => formatCount(locale, count, ["minute", "minutes"], ["минута", "минуты", "минут"]);
  const folderCount = (count: number) => formatCount(locale, count, ["folder", "folders"], ["папка", "папки", "папок"]);
  const environments = data.environments.filter((item) => item.projectId === project.id && item.status !== "archived");
  const suites = data.suites.filter((item) => item.projectId === project.id && item.status === "active");
  const cases = data.testCases.filter((item) => item.projectId === project.id && !item.archivedAt);
  const initialSuite = suites.find((item) => item.id === selectedSuiteId);
  const initialIds = presetCaseIds.filter((id) => cases.some((item) => item.id === id));
  const [stage, setStage] = useState<"scope" | "configuration">("scope");
  const [suiteId, setSuiteId] = useState(initialSuite?.id ?? "");
  const [caseIds, setCaseIds] = useState<string[]>(initialIds);
  const [query, setQuery] = useState("");
  const [environmentId, setEnvironmentId] = useState(environments.find((item) => item.isDefault)?.id ?? environments[0]?.id ?? "");
  const [type, setType] = useState<TestRunSummary["type"]>(presetCaseIds.length ? "ad_hoc" : "smoke");
  const [name, setName] = useState(`${project.name} ${presetCaseIds.length ? copy.integrationName : copy.smokeName} · ${copy.localBuild}`);
  const [build, setBuild] = useState("local-current");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<"start" | "create" | null>(null);
  const visibleCases = cases.filter((item) => `${item.key} ${item.folderPath} ${item.title} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const selectedCases = cases.filter((item) => caseIds.includes(item.id));
  const estimate = selectedCases.reduce((total, item) => total + (item.estimatedMinutes ?? 0), 0);
  const selectedSuite = suites.find((item) => item.id === suiteId);
  const selectionCount = selectedSuite?.caseCount ?? caseIds.length;
  const hasSelection = selectedSuite?.type === "dynamic" || selectionCount > 0;
  const selectionLabel = selectedSuite?.type === "dynamic"
    ? selectedSuite.name
    : caseCount(selectionCount);
  function selectSuite(nextSuiteId: string) {
    setSuiteId(nextSuiteId);
    setCaseIds([]);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !hasSelection) return;
    const suite = suites.find((item) => item.id === suiteId);
    const environment = environments.find((item) => item.id === environmentId);
    if (!environment) return;
    setSubmitting(true);
    setError(null);
    const result = await createRun({ http, project, environment, suite, caseIds, name, type, build, offline });
    if (!result.ok) {
      setError(result.reason);
      setSubmitting(false);
      return;
    }
    onCreated(result.run);
  }
  return <Modal title={copy.title} subtitle={copy.subtitle} onClose={onClose} wide>
    <form onSubmit={submit} className={styles.wizardForm}>
      <div className={styles.wizardSteps}>
        <button type="button" className={stage === "scope" ? styles.wizardStepActive : styles.wizardStepDone} onClick={() => setStage("scope")}><span>{stage === "configuration" ? <Check size={14} /> : 1}</span>{copy.scopeStep}</button>
        <button type="button" className={stage === "configuration" ? styles.wizardStepActive : ""} disabled={!hasSelection} onClick={() => setStage("configuration")}><span>2</span>{copy.configureStep}</button>
      </div>
      <div className={styles.wizardBody}>
        {stage === "scope" && <div className={styles.wizardPane}>
          <div className={styles.scopeIntro}><div><ListChecks size={21} /><span><strong>{copy.selected}: {selectionLabel}</strong><small>{!suiteId && estimate ? `${copy.estimated}: ${minuteCount(estimate)}` : copy.addCases}</small></span></div><Field label={copy.startFromSuite}><select value={suiteId} onChange={(event) => selectSuite(event.target.value)}><option value="">{copy.customSelection}</option>{suites.map((suite) => <option value={suite.id} key={suite.id}>{suite.name}{suite.type === "static" ? ` · ${caseCount(suite.caseCount)}` : ""}</option>)}</select></Field></div>
          <div className={styles.scopeHeader}><div><strong>{copy.repositoryCases}</strong><small>{copy.repositoryHint}</small></div><div><button type="button" className={styles.textButton} onClick={() => { setSuiteId(""); setCaseIds(Array.from(new Set([...caseIds, ...visibleCases.map((item) => item.id)]))); }}>{copy.selectVisible}</button><button type="button" className={styles.textButton} onClick={() => { setSuiteId(""); setCaseIds((current) => current.filter((id) => !visibleCases.some((item) => item.id === id))); }}>{copy.clearVisible}</button></div></div>
          <label className={styles.searchField}><Search size={16} /><input aria-label={copy.searchAria} autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label>
          <div className={styles.casePicker} data-testid="run-case-picker">
            {visibleCases.map((item) => { const checked = !suiteId && caseIds.includes(item.id); return <label key={item.id} className={checked ? styles.casePickerSelected : ""}><input type="checkbox" checked={checked} onChange={() => { setSuiteId(""); setCaseIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]); }} /><span><small>{item.key} · {item.folderPath} · {copy.revisionShort} {item.currentRevision}</small><strong>{item.title}</strong></span><em className={styles[`priority_${item.priority}`]}>{copy[item.priority]}</em></label>; })}
            {visibleCases.length === 0 && <div className={styles.miniEmpty}><Search size={19} /><span>{copy.noMatching}</span></div>}
          </div>
        </div>}
        {stage === "configuration" && <div className={styles.wizardPane}>
          {environments.length === 0 ? <div className={styles.blockerNotice}><FlaskConical size={22} /><span><strong>{copy.environmentRequired}</strong><small>{copy.environmentRequiredHint}</small></span></div> : <>
            <div className={styles.formGrid}>
              <Field label={copy.name} wide><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} /></Field>
              <Field label={copy.type}><select value={type} onChange={(event) => setType(event.target.value as TestRunSummary["type"])}><option value="smoke">{copy.smoke}</option><option value="regression">{copy.regression}</option><option value="acceptance">{copy.acceptance}</option><option value="ad_hoc">{copy.adHoc}</option></select></Field>
              <Field label={copy.build}><input value={build} onChange={(event) => setBuild(event.target.value)} /></Field>
              <Field label={copy.environment} wide><select value={environmentId} onChange={(event) => setEnvironmentId(event.target.value)}>{environments.map((environment) => <option value={environment.id} key={environment.id}>{environment.name} · {environment.baseUrl}</option>)}</select></Field>
            </div>
            <div className={styles.runReview}><div><strong>{copy.executionScope}</strong><span>{selectionLabel}{!suiteId && <> · {estimate || "—"} {copy.minuteShort} · {folderCount(new Set(selectedCases.map((item) => item.folderPath)).size)}</>}</span></div><div className={styles.runReviewCases}>{suiteId && selectedSuite ? <span><Check size={13} />{selectedSuite.key} · {selectedSuite.name}</span> : <>{selectedCases.slice(0, 6).map((item) => <span key={item.id}><Check size={13} />{item.key} · {item.title}</span>)}{selectedCases.length > 6 && <small>+ {copy.more} {caseCount(selectedCases.length - 6)}</small>}</>}</div></div>
            <div className={styles.snapshotNote}><RefreshCw size={18} /><span><strong>{copy.immutable}</strong><small>{copy.immutableHint}</small></span></div>
            {error && <FormError message={error === "start" ? copy.draftError : copy.createError} />}
          </>}
        </div>}
      </div>
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={() => { if (stage === "scope") onClose(); else setStage("scope"); }}>{stage === "scope" ? copy.cancel : <><ChevronLeft size={15} /> {copy.back}</>}</button>{stage === "scope" ? <button type="button" className={styles.primaryButton} disabled={!hasSelection} onClick={() => setStage("configuration")}>{copy.configure} <ChevronRight size={16} /></button> : <button className={styles.primaryButton} data-testid="start-run" disabled={submitting || !environmentId || !name.trim() || !hasSelection}><Play size={16} /> {submitting ? copy.starting : `${copy.startWith} ${selectionLabel}`}</button>}</div>
    </form>
  </Modal>;
}
