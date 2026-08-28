import { Plus, Save, Search } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Suite, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import {
  formatTmsMutationFailure,
  toTmsMutationFailure,
} from "../../../../../core/tms/errors/mutation-failure";
import {
  resolvePendingOperation,
  type PendingOperation,
} from "../../../../../core/tms/idempotency/pending-operation";
import { saveSuite } from "../../../application/suites/saveSuite";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { matchesSuite } from "../../../helpers/suites/matchesSuite";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { formatCount } from "../../../localization/format/count";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { getSuiteDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
export function SuiteDialog({ projectId, cases, suite, suiteEtag, offline, onClose, onSaved }: { projectId: string; cases: TestCaseSummary[]; suite?: Suite; suiteEtag?: string | null; offline: boolean; onClose: () => void; onSaved: (suite: Suite, etag: string | null) => void }) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const copy = getSuiteDialogCopy(locale);
  const caseCount = (count: number) => formatCount(locale, count, ["case", "cases"], ["тест-кейс", "тест-кейса", "тест-кейсов"]);
  const activeCases = cases.filter((item) => !item.archivedAt);
  const [name, setName] = useState<string>(suite?.name ?? copy.defaultName);
  const [description, setDescription] = useState<string>(suite?.description ?? copy.defaultDescription);
  const [type, setType] = useState<Suite["type"]>(suite?.type ?? "static");
  const [caseIds, setCaseIds] = useState<string[]>(suite ? activeCases.filter((item) => matchesSuite(item, suite)).map((item) => item.id) : activeCases.filter((item) => item.tags.includes("smoke")).map((item) => item.id));
  const [tags, setTags] = useState((suite?.filter.tags ?? ["smoke"]).join(", "));
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<PendingOperation | null>(null);
  const visibleCases = activeCases.filter((item) => `${item.key} ${item.title} ${item.folderPath} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const effectiveIds = type === "dynamic" ? activeCases.filter((item) => tags.split(",").map((tagName) => tagName.trim()).filter(Boolean).every((tagName) => item.tags.includes(tagName))).map((item) => item.id) : caseIds;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || effectiveIds.length === 0) return;
    setSubmitting(true);
    setError("");
    const normalizedTags = tags.split(",").map((item) => item.trim()).filter(Boolean);
    const signature = JSON.stringify({
      suiteId: suite?.id ?? null,
      suiteEtag: suiteEtag ?? null,
      projectId,
      name: name.trim(),
      description: description.trim(),
      type,
      caseIds: type === "static" ? Array.from(new Set(caseIds)) : [],
      tags: type === "dynamic" ? Array.from(new Set(normalizedTags)) : [],
    });
    operation.current = resolvePendingOperation(operation.current, signature);
    try { const saved = await saveSuite({ http, suite, suiteEtag, projectId, name, description, type, caseIds, tags: normalizedTags, offline, operationKey: operation.current.key }); onSaved(saved.data, saved.etag); }
    catch (caught) { setError(formatTmsMutationFailure(toTmsMutationFailure(caught), copy.error)); setSubmitting(false); }
  }
  return <Modal title={suite ? copy.configureTitle : copy.createTitle} subtitle={copy.subtitle} onClose={onClose} wide>
    <form onSubmit={submit} className={styles.wizardForm}>
      <div className={styles.wizardPane}><div className={styles.formGrid}>
        <Field label={copy.name} wide><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label={copy.description} wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <Field label={copy.mode} wide><div className={styles.segmented}><button type="button" className={type === "static" ? styles.segmentedActive : ""} onClick={() => setType("static")}>{copy.staticMode}</button><button type="button" className={type === "dynamic" ? styles.segmentedActive : ""} onClick={() => setType("dynamic")}>{copy.dynamicMode}</button></div></Field>
        {type === "dynamic" && <Field label={copy.tags} wide><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={copy.tagsPlaceholder} /></Field>}
      </div>
      <div className={styles.scopeHeader}><div><strong>{caseCount(effectiveIds.length)} {copy.scope}</strong><small>{type === "dynamic" ? copy.dynamicHint : copy.staticHint}</small></div>{type === "static" && <div><button type="button" className={styles.textButton} onClick={() => setCaseIds(Array.from(new Set([...caseIds, ...visibleCases.map((item) => item.id)])))}>{copy.selectVisible}</button><button type="button" className={styles.textButton} onClick={() => setCaseIds((current) => current.filter((id) => !visibleCases.some((item) => item.id === id)))}>{copy.clearVisible}</button></div>}</div>
      <label className={styles.searchField}><Search size={16} /><input aria-label={copy.searchAria} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label>
      <div className={styles.casePicker}>
        {visibleCases.map((item) => { const checked = effectiveIds.includes(item.id); return <label key={item.id} className={checked ? styles.casePickerSelected : ""}><input type="checkbox" checked={checked} disabled={type === "dynamic"} onChange={() => setCaseIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} /><span><small>{item.key} · {item.folderPath}</small><strong>{item.title}</strong></span><em className={styles[`priority_${item.priority}`]}>{copy[item.priority]}</em></label>; })}
        {visibleCases.length === 0 && <div className={styles.miniEmpty}><Search size={19} /><span>{copy.noMatching}</span></div>}
      </div>
      {error && <FormError message={error} />}
      </div>
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || effectiveIds.length === 0}><Save size={16} /> {submitting ? copy.saving : suite ? copy.save : copy.create}</button></div>
    </form>
  </Modal>;
}
