import { Check, Play } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Bootstrap, Project, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { createRun } from "../../../application/runs/createRun";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { formatCount } from "../../../localization/format/count";
import { useResolvedSuiteCount } from "../../../state/run-builder/useResolvedSuiteCount";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { RunScopeBuilder } from "../run-scope/RunScopeBuilder";
import { createDefaultRunName } from "../run-builder/model";
import { getRunDialogCopy, type RunDialogCopy } from "./copy";
import styles from "./RunDialog.module.css";

type Props = {
  data: Bootstrap; project: Project; selectedSuiteId: string; presetCaseIds: string[];
  offline: boolean; onClose: () => void; onCreated: (run: TestRunSummary) => void;
};

const runTypeLabel = (copy: RunDialogCopy, type: TestRunSummary["type"]) => ({
  smoke: copy.smoke, regression: copy.regression, acceptance: copy.acceptance, ad_hoc: copy.adHoc,
})[type];

export function RunDialog({ data, project, selectedSuiteId, presetCaseIds, offline, onClose, onCreated }: Props) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const copy = getRunDialogCopy(locale);
  const environments = data.environments.filter((item) => item.projectId === project.id && item.status !== "archived");
  const suites = data.suites.filter((item) => item.projectId === project.id && item.status === "active");
  const cases = data.testCases.filter((item) => item.projectId === project.id && !item.archivedAt);
  const initialSuite = suites.find((item) => item.id === selectedSuiteId);
  const initialIds = presetCaseIds.filter((id) => cases.some((item) => item.id === id));
  const presetCase = initialIds.length === 1 ? cases.find((item) => item.id === initialIds[0]) : undefined;
  const fastCase = Boolean(presetCase && !initialSuite);
  const [timestamp] = useState(() => new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
  const initialType: TestRunSummary["type"] = initialIds.length ? "ad_hoc" : "smoke";
  const [suiteId, setSuiteId] = useState(initialSuite?.id ?? "");
  const [caseIds, setCaseIds] = useState<string[]>(initialIds);
  const [builderOpen, setBuilderOpen] = useState(!fastCase && !initialSuite);
  const [environmentId, setEnvironmentId] = useState(environments.find((item) => item.isDefault)?.id ?? environments[0]?.id ?? "");
  const [type, setType] = useState<TestRunSummary["type"]>(initialType);
  const [build, setBuild] = useState("local-current");
  const makeName = (nextType: TestRunSummary["type"], nextBuild: string, scope = presetCase?.key ?? initialSuite?.key) =>
    createDefaultRunName({ projectName: project.name, scope, typeLabel: runTypeLabel(copy, nextType), build: nextBuild, timestamp });
  const [name, setName] = useState(() => makeName(initialType, "local-current"));
  const [nameEdited, setNameEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<PendingOperation | null>(null);
  const selectedSuite = suites.find((item) => item.id === suiteId);
  const { count: suiteCount, error: suiteError } = useResolvedSuiteCount(http, selectedSuite, offline, copy.suiteResolveError);
  const selectedCases = cases.filter((item) => caseIds.includes(item.id));
  const selectionCount = selectedSuite ? suiteCount ?? 0 : caseIds.length;
  const hasSelection = selectionCount > 0;
  const countLabel = (count: number) => formatCount(locale, count, ["case", "cases"], ["кейс", "кейса", "кейсов"]);
  const title = fastCase && presetCase ? `${copy.runCase}: ${presetCase.key}` : initialSuite ? `${copy.runSuite}: ${initialSuite.name}` : copy.title;
  const subtitle = fastCase && presetCase ? `${presetCase.title} · ${project.name}` : copy.subtitle;

  const changeType = (next: TestRunSummary["type"]) => { setType(next); if (!nameEdited) setName(makeName(next, build, selectedSuite?.key)); };
  const changeBuild = (next: string) => { setBuild(next); if (!nameEdited) setName(makeName(type, next, selectedSuite?.key)); };
  const changeSuite = (nextId: string) => {
    setSuiteId(nextId);
    const nextSuite = suites.find((item) => item.id === nextId);
    if (!nameEdited) setName(makeName(type, build, nextSuite?.key));
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !hasSelection) return;
    const environment = environments.find((item) => item.id === environmentId);
    if (!environment) return;
    setSubmitting(true); setError("");
    const signature = JSON.stringify({ projectId: project.id, environmentId, suiteId: selectedSuite?.id ?? null, caseIds: selectedSuite ? [] : caseIds, name, type, build });
    operation.current = resolvePendingOperation(operation.current, signature);
    const result = await createRun({ http, project, environment, suite: selectedSuite, caseIds, name, type, build, offline, operationKey: operation.current.key });
    if (!result.ok) { setError(formatTmsMutationFailure(result.failure, copy.createError)); setSubmitting(false); return; }
    onCreated(result.run);
  }

  const targetSection = <section className={styles.section}>
    <header className={styles.sectionHeading}><div><h3>{copy.targetTitle}</h3><p>{copy.targetHint}</p></div></header>
    {environments.length === 0 ? <div className={styles.blocker}><strong>{copy.environmentRequired}</strong><span>{copy.environmentRequiredHint}</span></div> : <div className={styles.targetGrid}>
      <label><span>{copy.environment}</span><select autoFocus={!builderOpen} value={environmentId} onChange={(event) => setEnvironmentId(event.target.value)}>{environments.map((environment) => <option key={environment.id} value={environment.id}>{environment.name} · {environment.baseUrl}</option>)}</select></label>
      <label><span>{copy.build}</span><input value={build} onChange={(event) => changeBuild(event.target.value)} /></label>
      <label className={styles.nameField}><span>{copy.name}</span><input required value={name} onChange={(event) => { setNameEdited(true); setName(event.target.value); }} /></label>
      <label><span>{copy.type}</span><select value={type} onChange={(event) => changeType(event.target.value as TestRunSummary["type"])}><option value="smoke">{copy.smoke}</option><option value="regression">{copy.regression}</option><option value="acceptance">{copy.acceptance}</option><option value="ad_hoc">{copy.adHoc}</option></select></label>
    </div>}
  </section>;
  const scopeSection = <section className={styles.section}>
    <header className={styles.sectionHeading}><div><h3>{copy.scopeTitle}</h3><p>{copy.scopeHint}</p></div>{(fastCase || initialSuite) && <button type="button" onClick={() => setBuilderOpen((value) => !value)}>{builderOpen ? copy.hideBuilder : fastCase ? copy.addMore : copy.changeScope}</button>}</header>
    {!builderOpen && fastCase && presetCase && <div className={styles.scopeSummary}><Check size={17} /><span><small>{copy.currentCase}</small><strong>{presetCase.key} · {presetCase.title}</strong><em>{countLabel(caseIds.length)}</em></span></div>}
    {!builderOpen && initialSuite && <SuiteSummary suite={initialSuite} copy={copy} count={suiteCount === null ? copy.resolvingSuite : countLabel(suiteCount)} />}
    {builderOpen && <>
      <label className={styles.sourceField}><span>{copy.source}</span><select value={suiteId} onChange={(event) => changeSuite(event.target.value)}><option value="">{copy.customSelection}</option>{suites.map((suite) => <option key={suite.id} value={suite.id}>{suite.name} · {suite.type === "dynamic" ? copy.dynamicSuite : countLabel(suite.caseCount)}</option>)}</select></label>
      {selectedSuite ? <SuiteSummary suite={selectedSuite} copy={copy} count={suiteCount === null ? copy.resolvingSuite : countLabel(suiteCount)} /> : <RunScopeBuilder cases={cases} caseIds={caseIds} setCaseIds={setCaseIds} copy={copy} />}
    </>}
    {selectedCases.length > 0 && !fastCase && !selectedSuite && <p className={styles.selectedPreview}>{selectedCases.slice(0, 4).map((item) => item.key).join(", ")}{selectedCases.length > 4 ? ` +${selectedCases.length - 4}` : ""}</p>}
    {(error || suiteError) && <FormError message={error || suiteError} />}
  </section>;

  return <Modal title={title} subtitle={subtitle} onClose={onClose} wide drawer panelClassName={styles.runPanel}>
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.body}>
        {fastCase && !builderOpen ? <>{targetSection}{scopeSection}</> : <>{scopeSection}{targetSection}</>}
      </div>
      <footer className={styles.footer}><span className={!hasSelection ? styles.footerWarning : ""}>{hasSelection ? `${copy.selected}: ${countLabel(selectionCount)}` : selectedSuite?.type === "dynamic" && !suiteError ? copy.resolvingSuite : copy.selectionRequired}</span><div><button type="button" className={styles.cancelButton} onClick={onClose}>{copy.cancel}</button><button className={styles.startButton} data-testid="start-run" disabled={submitting || !environmentId || !name.trim() || !hasSelection}><Play size={16} />{submitting ? copy.starting : `${copy.startRun} · ${selectionCount}`}</button></div></footer>
    </form>
  </Modal>;
}

function SuiteSummary({ suite, copy, count }: { suite: Bootstrap["suites"][number]; copy: RunDialogCopy; count: string }) {
  return <div className={styles.scopeSummary}><Check size={17} /><span><small>{suite.type === "dynamic" ? copy.dynamicSuite : copy.staticSuite}</small><strong>{suite.key} · {suite.name}</strong><em>{count} · {copy.resolvedNow}</em></span></div>;
}
