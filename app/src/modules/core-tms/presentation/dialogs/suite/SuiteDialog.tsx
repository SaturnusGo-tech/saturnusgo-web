import { Plus, Save, Search } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Suite, TestCase } from "../../../../../core/tms/contracts/legacy-contract";
import { saveSuite } from "../../../application/suites/saveSuite";
import { latestRevision } from "../../../helpers/cases/caseRevision";
import { matchesSuite } from "../../../helpers/suites/matchesSuite";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import styles from "../../../tms.module.css";
export function SuiteDialog({ projectId, cases, suite, offline, onClose, onSaved }: { projectId: string; cases: TestCase[]; suite?: Suite; offline: boolean; onClose: () => void; onSaved: (suite: Suite) => void }) {
  const activeCases = cases.filter((item) => !item.archivedAt);
  const [name, setName] = useState(suite?.name ?? "Release smoke");
  const [description, setDescription] = useState(suite?.description ?? "Critical checks for the current build");
  const [type, setType] = useState<Suite["type"]>(suite?.type ?? "static");
  const [caseIds, setCaseIds] = useState<string[]>(suite ? activeCases.filter((item) => matchesSuite(item, suite)).map((item) => item.id) : activeCases.filter((item) => latestRevision(item).tags.includes("smoke")).map((item) => item.id));
  const [tags, setTags] = useState((suite?.filter.tags ?? ["smoke"]).join(", "));
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const visibleCases = activeCases.filter((item) => `${item.key} ${latestRevision(item).title} ${item.folderPath} ${latestRevision(item).tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const effectiveIds = type === "dynamic" ? activeCases.filter((item) => tags.split(",").map((tagName) => tagName.trim()).filter(Boolean).every((tagName) => latestRevision(item).tags.includes(tagName))).map((item) => item.id) : caseIds;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || effectiveIds.length === 0) return;
    setSubmitting(true);
    setError("");
    try { onSaved(await saveSuite({ suite, projectId, name, description, type, caseIds, tags: tags.split(",").map((item) => item.trim()).filter(Boolean), offline })); }
    catch { setError("The suite was not accepted by the TMS API. Review the selected cases and try again."); setSubmitting(false); }
  }
  return <Modal title={suite ? "Configure test suite" : "Create test suite"} subtitle="Define a reusable scope now; every run can still adjust its final case selection." onClose={onClose} wide>
    <form onSubmit={submit} className={styles.wizardForm}>
      <div className={styles.wizardPane}><div className={styles.formGrid}>
        <Field label="Suite name" wide><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Description" wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <Field label="Selection mode" wide><div className={styles.segmented}><button type="button" className={type === "static" ? styles.segmentedActive : ""} onClick={() => setType("static")}>Static case selection</button><button type="button" className={type === "dynamic" ? styles.segmentedActive : ""} onClick={() => setType("dynamic")}>Dynamic by tags</button></div></Field>
        {type === "dynamic" && <Field label="Required tags" wide><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="smoke, mobile" /></Field>}
      </div>
      <div className={styles.scopeHeader}><div><strong>{effectiveIds.length} cases in scope</strong><small>{type === "dynamic" ? "Updates automatically when matching tags change" : "Exact list maintained by this suite"}</small></div>{type === "static" && <div><button type="button" className={styles.textButton} onClick={() => setCaseIds(Array.from(new Set([...caseIds, ...visibleCases.map((item) => item.id)])))}>Select visible</button><button type="button" className={styles.textButton} onClick={() => setCaseIds((current) => current.filter((id) => !visibleCases.some((item) => item.id === id)))}>Clear visible</button></div>}</div>
      <label className={styles.searchField}><Search size={16} /><input aria-label="Search cases for suite" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by key, title, folder, or tag" /></label>
      <div className={styles.casePicker}>
        {visibleCases.map((item) => { const value = latestRevision(item); const checked = effectiveIds.includes(item.id); return <label key={item.id} className={checked ? styles.casePickerSelected : ""}><input type="checkbox" checked={checked} disabled={type === "dynamic"} onChange={() => setCaseIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} /><span><small>{item.key} · {item.folderPath}</small><strong>{value.title}</strong></span><em className={styles[`priority_${value.priority}`]}>{value.priority}</em></label>; })}
        {visibleCases.length === 0 && <div className={styles.miniEmpty}><Search size={19} /><span>No matching test cases</span></div>}
      </div>
      {error && <FormError message={error} />}
      </div>
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || effectiveIds.length === 0}><Save size={16} /> {submitting ? "Saving…" : suite ? "Save suite" : "Create suite"}</button></div>
    </form>
  </Modal>;
}
