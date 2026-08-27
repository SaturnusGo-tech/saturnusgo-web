import { Check, ChevronLeft, ChevronRight, FlaskConical, ListChecks, Play, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Bootstrap, Project, TestRun } from "../../../../../core/tms/contracts/legacy-contract";
import { createRun } from "../../../application/runs/createRun";
import { latestRevision } from "../../../helpers/cases/caseRevision";
import { matchesSuite } from "../../../helpers/suites/matchesSuite";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import styles from "../../../tms.module.css";
export function RunDialog({ data, project, selectedSuiteId, presetCaseIds, offline, onClose, onCreated }: { data: Bootstrap; project: Project; selectedSuiteId: string; presetCaseIds: string[]; offline: boolean; onClose: () => void; onCreated: (run: TestRun) => void }) {
  const environments = data.environments.filter((item) => item.projectId === project.id && item.status !== "archived");
  const suites = data.suites.filter((item) => item.projectId === project.id && item.status === "active");
  const cases = data.testCases.filter((item) => item.projectId === project.id && !item.archivedAt);
  const initialSuite = suites.find((item) => item.id === selectedSuiteId);
  const initialIds = presetCaseIds.length ? presetCaseIds.filter((id) => cases.some((item) => item.id === id)) : initialSuite ? cases.filter((item) => matchesSuite(item, initialSuite)).map((item) => item.id) : [];
  const [stage, setStage] = useState<"scope" | "configuration">("scope");
  const [suiteId, setSuiteId] = useState(initialSuite?.id ?? "");
  const [caseIds, setCaseIds] = useState<string[]>(initialIds);
  const [query, setQuery] = useState("");
  const [environmentId, setEnvironmentId] = useState(environments.find((item) => item.isDefault)?.id ?? environments[0]?.id ?? "");
  const [type, setType] = useState<TestRun["type"]>(presetCaseIds.length ? "ad_hoc" : "smoke");
  const [name, setName] = useState(`${project.name} ${presetCaseIds.length ? "integration" : "smoke"} · local build`);
  const [build, setBuild] = useState("local-current");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const visibleCases = cases.filter((item) => `${item.key} ${item.folderPath} ${latestRevision(item).title} ${latestRevision(item).tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const selectedCases = cases.filter((item) => caseIds.includes(item.id));
  const estimate = selectedCases.reduce((total, item) => total + (latestRevision(item).estimatedMinutes ?? 0), 0);
  function selectSuite(nextSuiteId: string) {
    setSuiteId(nextSuiteId);
    const suite = suites.find((item) => item.id === nextSuiteId);
    setCaseIds(suite ? cases.filter((item) => matchesSuite(item, suite)).map((item) => item.id) : []);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || caseIds.length === 0) return;
    const suite = suites.find((item) => item.id === suiteId);
    const environment = environments.find((item) => item.id === environmentId);
    if (!environment) return;
    setSubmitting(true);
    setError("");
    const result = await createRun({ data, project, environment, suite, caseIds, name, type, build, offline });
    if (!result.ok) {
      setError(result.reason === "start" ? "The run was created as a draft, but the API could not start it. Review the target and try again from Runs." : "The run was not created. Confirm the selected cases and environment, then try again.");
      setSubmitting(false);
      return;
    }
    onCreated(result.run);
  }
  return <Modal title="Start a test run" subtitle="Choose the exact test cases first, then confirm the execution target." onClose={onClose} wide>
    <form onSubmit={submit} className={styles.wizardForm}>
      <div className={styles.wizardSteps}>
        <button type="button" className={stage === "scope" ? styles.wizardStepActive : styles.wizardStepDone} onClick={() => setStage("scope")}><span>{stage === "configuration" ? <Check size={14} /> : 1}</span>Test case scope</button>
        <button type="button" className={stage === "configuration" ? styles.wizardStepActive : ""} disabled={caseIds.length === 0} onClick={() => setStage("configuration")}><span>2</span>Configure and start</button>
      </div>
      <div className={styles.wizardBody}>
        {stage === "scope" && <div className={styles.wizardPane}>
          <div className={styles.scopeIntro}><div><ListChecks size={21} /><span><strong>{caseIds.length} selected test {caseIds.length === 1 ? "case" : "cases"}</strong><small>{estimate ? `Estimated ${estimate} ${estimate === 1 ? "minute" : "minutes"}` : "Add cases to create the run"}</small></span></div><Field label="Start from suite"><select value={suiteId} onChange={(event) => selectSuite(event.target.value)}><option value="">Custom selection</option>{suites.map((suite) => { const count = cases.filter((item) => matchesSuite(item, suite)).length; return <option value={suite.id} key={suite.id}>{suite.name} · {count} {count === 1 ? "case" : "cases"}</option>; })}</select></Field></div>
          <div className={styles.scopeHeader}><div><strong>Repository cases</strong><small>The final checked list is what will be snapshotted.</small></div><div><button type="button" className={styles.textButton} onClick={() => setCaseIds(Array.from(new Set([...caseIds, ...visibleCases.map((item) => item.id)])))}>Select visible</button><button type="button" className={styles.textButton} onClick={() => setCaseIds((current) => current.filter((id) => !visibleCases.some((item) => item.id === id)))}>Clear visible</button></div></div>
          <label className={styles.searchField}><Search size={16} /><input aria-label="Search cases for run" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search key, title, folder, or tag" /></label>
          <div className={styles.casePicker} data-testid="run-case-picker">
            {visibleCases.map((item) => { const value = latestRevision(item); const checked = caseIds.includes(item.id); return <label key={item.id} className={checked ? styles.casePickerSelected : ""}><input type="checkbox" checked={checked} onChange={() => setCaseIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} /><span><small>{item.key} · {item.folderPath} · rev {item.currentRevision}</small><strong>{value.title}</strong></span><em className={styles[`priority_${value.priority}`]}>{value.priority}</em></label>; })}
            {visibleCases.length === 0 && <div className={styles.miniEmpty}><Search size={19} /><span>No matching cases</span></div>}
          </div>
        </div>}
        {stage === "configuration" && <div className={styles.wizardPane}>
          {environments.length === 0 ? <div className={styles.blockerNotice}><FlaskConical size={22} /><span><strong>Create an environment before starting</strong><small>A run must snapshot a real test target. Close this dialog and open Config → New environment.</small></span></div> : <>
            <div className={styles.formGrid}>
              <Field label="Run name" wide><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} /></Field>
              <Field label="Run type"><select value={type} onChange={(event) => setType(event.target.value as TestRun["type"])}><option value="smoke">Smoke</option><option value="regression">Regression</option><option value="acceptance">Acceptance</option><option value="ad_hoc">Ad hoc</option></select></Field>
              <Field label="Build"><input value={build} onChange={(event) => setBuild(event.target.value)} /></Field>
              <Field label="Environment" wide><select value={environmentId} onChange={(event) => setEnvironmentId(event.target.value)}>{environments.map((environment) => <option value={environment.id} key={environment.id}>{environment.name} · {environment.baseUrl}</option>)}</select></Field>
            </div>
            <div className={styles.runReview}><div><strong>Execution scope</strong><span>{selectedCases.length} {selectedCases.length === 1 ? "case" : "cases"} · {estimate || "—"} min · {new Set(selectedCases.map((item) => item.folderPath)).size} {new Set(selectedCases.map((item) => item.folderPath)).size === 1 ? "folder" : "folders"}</span></div><div className={styles.runReviewCases}>{selectedCases.slice(0, 6).map((item) => <span key={item.id}><Check size={13} />{item.key} · {latestRevision(item).title}</span>)}{selectedCases.length > 6 && <small>+ {selectedCases.length - 6} more cases</small>}</div></div>
            <div className={styles.snapshotNote}><RefreshCw size={18} /><span><strong>Immutable execution snapshot</strong><small>These revisions, this environment, and this build stay fixed after start.</small></span></div>
            {error && <FormError message={error} />}
          </>}
        </div>}
      </div>
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={() => { if (stage === "scope") onClose(); else setStage("scope"); }}>{stage === "scope" ? "Cancel" : <><ChevronLeft size={15} /> Back to cases</>}</button>{stage === "scope" ? <button type="button" className={styles.primaryButton} disabled={caseIds.length === 0} onClick={() => setStage("configuration")}>Configure run <ChevronRight size={16} /></button> : <button className={styles.primaryButton} data-testid="start-run" disabled={submitting || !environmentId || !name.trim() || caseIds.length === 0}><Play size={16} /> {submitting ? "Starting…" : `Start run with ${caseIds.length} ${caseIds.length === 1 ? "case" : "cases"}`}</button>}</div>
    </form>
  </Modal>;
}
