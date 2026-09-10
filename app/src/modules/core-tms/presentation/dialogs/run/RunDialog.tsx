import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { Layers, Play, ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Bootstrap, Project, Suite, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { createRun } from "../../../application/runs/createRun";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { formatCount } from "../../../localization/format/count";
import { useResolvedSuiteCount } from "../../../state/run-builder/useResolvedSuiteCount";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { RunScopeBuilder } from "../run-scope/RunScopeBuilder";
import { getRunDialogCopy, type RunDialogCopy } from "./copy";
import styles from "./RunDialog.module.css";

type Props = {
  data: Bootstrap; project: Project; selectedSuiteId: string; presetCaseIds: string[];
  selectedSuiteDetail?: Suite | null;
  offline: boolean; onClose: () => void; onCreated: (run: TestRunSummary) => void;
};

const runTypeLabel = (copy: RunDialogCopy, type: TestRunSummary["type"]) => ({
  smoke: copy.smoke, regression: copy.regression, acceptance: copy.acceptance, ad_hoc: copy.adHoc,
})[type];

export function RunDialog({ data, project, selectedSuiteId, presetCaseIds, selectedSuiteDetail, offline, onClose, onCreated }: Props) {
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
  const initialType: TestRunSummary["type"] = initialIds.length ? "ad_hoc" : "smoke";
  const [assigneeIdentityId, setAssignee] = useState<string | null>(null);
  const [suiteId, setSuiteId] = useState(initialSuite?.id ?? "");
  const [caseIds, setCaseIds] = useState<string[]>(initialIds);
  const [builderOpen, setBuilderOpen] = useState(!fastCase && !initialSuite);
  const [environmentId, setEnvironmentId] = useState(environments.find((item) => item.isDefault)?.id ?? environments[0]?.id ?? "");
  const [type, setType] = useState<TestRunSummary["type"]>(initialType);
  const [build, setBuild] = useState("local-current");
  const makeName = (nextType: TestRunSummary["type"], scope?: string) => scope?.trim() || runTypeLabel(copy, nextType);
  const [name, setName] = useState(() => makeName(initialType, initialSuite?.name ?? presetCase?.title));
  const [nameEdited, setNameEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<PendingOperation | null>(null);
  const environmentField = useRef<HTMLLabelElement>(null);
  const focusEnvironmentOnMount = useRef(!builderOpen);
  const selectedSuite = suites.find((item) => item.id === suiteId);
  const knownSuiteDetail = selectedSuiteDetail?.id === selectedSuite?.id ? selectedSuiteDetail : null;
  const { count: suiteCount, error: suiteError } = useResolvedSuiteCount(http, selectedSuite, offline, copy.suiteResolveError, knownSuiteDetail);
  const selectedCases = cases.filter((item) => caseIds.includes(item.id));
  const selectionCount = selectedSuite ? suiteCount ?? 0 : caseIds.length;
  const hasSelection = selectionCount > 0;
  const countLabel = (count: number) => formatCount(locale, count, ["case", "cases"], ["кейс", "кейса", "кейсов"]);
  const title = copy.title;
  const subtitle = project.name;

  useEffect(() => {
    if (focusEnvironmentOnMount.current) environmentField.current?.querySelector("button")?.focus();
  }, []);

  const changeType = (next: TestRunSummary["type"]) => { setType(next); if (!nameEdited) setName(makeName(next, selectedSuite?.name ?? presetCase?.title)); };
  const changeBuild = (next: string) => setBuild(next);
  const changeSuite = (nextId: string) => {
    setSuiteId(nextId);
    const nextSuite = suites.find((item) => item.id === nextId);
    if (!nameEdited) setName(makeName(type, nextSuite?.name));
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || !hasSelection) return;
    const environment = environments.find((item) => item.id === environmentId);
    if (!environment) return;
    setSubmitting(true); setError("");
    const signature = JSON.stringify({ assigneeIdentityId, projectId: project.id, environmentId, suiteId: selectedSuite?.id ?? null, caseIds: selectedSuite ? [] : caseIds, name, type, build });
    operation.current = resolvePendingOperation(operation.current, signature);
    const result = await createRun({ http, project, environment, suite: selectedSuite, caseIds, name, type, build, offline, assigneeIdentityId, operationKey: operation.current.key });
    if (!result.ok) { setError(formatTmsMutationFailure(result.failure, copy.createError)); setSubmitting(false); return; }
    onCreated(result.run);
  }

  const targetSection = <section className={styles.section}>
    <header className={styles.sectionHeading}><div><h3>{copy.targetTitle}</h3></div></header>
    {environments.length === 0 ? <div className={styles.blocker}><strong>{copy.environmentRequired}</strong><span>{copy.environmentRequiredHint}</span></div> : <div className={styles.targetGrid}>
      <label ref={environmentField}><span>{copy.environment}</span><AnimatedSelect label={copy.environment} value={environmentId} onChange={setEnvironmentId} options={environments.map((environment) => ({ value: environment.id, label: environment.name }))} /></label>
      <label><span>{copy.build}</span><span className={styles.inputShell} data-input-shell><input value={build} onChange={(event) => changeBuild(event.target.value)} /></span></label>
      <label><span>{copy.type}</span><AnimatedSelect label={copy.type} value={type} onChange={(value) => changeType(value as TestRunSummary["type"])} options={[{ value: "smoke", label: copy.smoke }, { value: "regression", label: copy.regression }, { value: "acceptance", label: copy.acceptance }, { value: "ad_hoc", label: copy.adHoc }]} /></label>
    </div>}
  </section>;
  const scopeSection = <section className={styles.section}>
    <header className={styles.sectionHeading}><div><h3>{copy.scopeTitle}</h3></div>{(fastCase || initialSuite) && <button type="button" onClick={() => setBuilderOpen((value) => !value)}>{builderOpen ? copy.hideBuilder : fastCase ? copy.addMore : copy.changeScope}<ChevronDown size={13} style={{ transform: builderOpen ? "rotate(180deg)" : undefined }} /></button>}</header>
    {!builderOpen && !selectedSuite && <div className={styles.scopeSummary}><Check size={17} /><span><small>{copy.customSelection}</small><strong>{selectedCases.length === 1 ? selectedCases[0].title : copy.scopeTitle}</strong><em>{countLabel(caseIds.length)}</em></span></div>}
    {!builderOpen && selectedSuite && <SuiteSummary suite={selectedSuite} copy={copy} count={suiteCount === null ? copy.resolvingSuite : countLabel(suiteCount)} />}
    {builderOpen && <>
      <label className={styles.sourceField}><span>{copy.source}</span><AnimatedSelect label={copy.source} value={suiteId} onChange={changeSuite} options={[{ value: "", label: copy.customSelection }, ...suites.map((suite) => ({ value: suite.id, label: `${suite.name} · ${suite.type === "dynamic" ? copy.dynamicSuite : copy.staticSuite}` }))]} /></label>
      {selectedSuite ? <SuiteSummary suite={selectedSuite} copy={copy} count={suiteCount === null ? copy.resolvingSuite : countLabel(suiteCount)} /> : <RunScopeBuilder cases={cases} caseIds={caseIds} setCaseIds={setCaseIds} copy={copy} />}
    </>}
    {selectedCases.length > 0 && !fastCase && !selectedSuite && <p className={styles.selectedPreview}>{selectedCases.slice(0, 4).map((item) => item.key).join(", ")}{selectedCases.length > 4 ? ` +${selectedCases.length - 4}` : ""}</p>}
    {(error || suiteError) && <FormError message={error || suiteError} />}
  </section>;

  return <Modal title={title} subtitle={subtitle} onClose={onClose} wide drawer panelClassName={styles.runPanel}>
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.body}>
        <section className={styles.nameSection}><label className={styles.nameField}><span>{copy.name}</span><span data-input-shell className={styles.inputShell}><input required value={name} onChange={(event) => { setNameEdited(true); setName(event.target.value); }} /></span></label></section>
        {scopeSection}{targetSection}
        <section className={styles.section}><h3>{locale === "ru" ? "Ответственный" : "Responsible"}</h3><ResponsiblePicker workspaceId={data.workspace.id} value={assigneeIdentityId} onChange={setAssignee} offline={offline} disabled={submitting} /></section>
        <p className={styles.resultHint}>{copy.targetHint}</p>
      </div>
      <footer className={styles.footer}><span className={!hasSelection ? styles.footerWarning : ""}>{hasSelection ? `${copy.selected}: ${countLabel(selectionCount)}` : selectedSuite && suiteCount === null && !suiteError ? copy.resolvingSuite : copy.selectionRequired}</span><div><button type="button" className={styles.cancelButton} onClick={onClose}>{copy.cancel}</button><button className={styles.startButton} data-testid="start-run" disabled={submitting || !environmentId || !name.trim() || !hasSelection}><Play size={16} />{submitting ? copy.starting : copy.startRun}</button></div></footer>
    </form>
  </Modal>;
}

function SuiteSummary({ suite, copy, count }: { suite: Bootstrap["suites"][number]; copy: RunDialogCopy; count: string }) {
  return <div className={styles.scopeSummary}><Layers size={20} strokeWidth={1.5} /><span><small>{suite.type === "dynamic" ? copy.dynamicSuite : copy.staticSuite}</small><strong>{suite.name}</strong><em>{count}</em></span></div>;
}
