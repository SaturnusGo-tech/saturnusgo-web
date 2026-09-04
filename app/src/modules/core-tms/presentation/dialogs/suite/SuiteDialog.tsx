import { ChevronDown, ListChecks, Save, Search } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useMemo, useRef, useState } from "react";
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
import { EmbeddedCaseList } from "../../cases/embedded/EmbeddedCaseList";
import { getSuiteDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
import dialog from "./suite-dialog.module.css";
export function SuiteDialog({ projectId, cases, suite, suiteEtag, offline, onClose, onSaved }: { projectId: string; cases: TestCaseSummary[]; suite?: Suite; suiteEtag?: string | null; offline: boolean; onClose: () => void; onSaved: (suite: Suite, etag: string | null) => void }) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const copy = getSuiteDialogCopy(locale);
  const caseCount = (count: number) => formatCount(locale, count, ["case", "cases"], ["тест-кейс", "тест-кейса", "тест-кейсов"]);
  const activeCases = cases.filter((item) => !item.archivedAt);
  const [name, setName] = useState<string>(suite?.name ?? copy.defaultName);
  const [description, setDescription] = useState<string>(suite?.description ?? copy.defaultDescription);
  const [type, setType] = useState<Suite["type"]>(suite?.type ?? "static");
  const [caseIds, setCaseIds] = useState<string[]>(suite ? activeCases.filter((item) => matchesSuite(item, suite)).map((item) => item.id) : activeCases.filter((item) => item.tags.includes("smoke")).map((item) => item.id));
  const [tags, setTags] = useState((suite?.filter.tags ?? ["smoke"]).join(", "));
  const [query, setQuery] = useState("");
  const [showCases, setShowCases] = useState(true);
  const [scopeRef] = useAutoAnimate<HTMLElement>({ duration: 160 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<PendingOperation | null>(null);
  const visibleCases = activeCases.filter((item) => `${item.key} ${item.title} ${item.folderPath} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const normalizedTags = tags.split(",").map((tagName) => tagName.trim()).filter(Boolean);
  const effectiveIds = type === "dynamic" && normalizedTags.length > 0 ? activeCases.filter((item) => normalizedTags.every((tagName) => item.tags.includes(tagName))).map((item) => item.id) : type === "dynamic" ? [] : caseIds;
  const previewCases = type === "dynamic" ? visibleCases.filter((item) => effectiveIds.includes(item.id)) : visibleCases;
  const selectedIds = useMemo(() => new Set(effectiveIds), [effectiveIds]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || effectiveIds.length === 0) return;
    setSubmitting(true);
    setError("");
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
  return <Modal title={suite ? copy.configureTitle : copy.createTitle} subtitle={copy.subtitle} onClose={onClose} panelClassName={dialog.panel} wide drawer>
    <form onSubmit={submit} className={`${styles.drawerForm} ${styles.productionDrawerForm} ${dialog.form}`}>
      <div className={`${styles.drawerBody} ${dialog.body}`}><section className={dialog.section}><div className={dialog.sectionHeading}><ListChecks size={16} /><span><strong>{ru ? "Основное" : "Overview"}</strong><small>{ru ? "Название и назначение набора" : "Suite name and purpose"}</small></span></div><div className={`${styles.formGrid} ${dialog.grid}`}>
        <Field label={copy.name} wide><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label={copy.description} wide><textarea className={`${styles.drawerTextarea} ${dialog.textarea}`} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <div className={dialog.modeField}><span>{copy.mode}</span><div className={dialog.modeGroup} role="group" aria-label={copy.mode}>
          <button type="button" className={dialog.modeButton} data-selected={type === "static"} aria-pressed={type === "static"} onClick={() => setType("static")}><strong>{copy.staticMode}</strong><span>{copy.staticModeHint}</span></button>
          <button type="button" className={dialog.modeButton} data-selected={type === "dynamic"} aria-pressed={type === "dynamic"} onClick={() => setType("dynamic")}><strong>{copy.dynamicMode}</strong><span>{copy.dynamicModeHint}</span></button>
        </div></div>
        {type === "dynamic" && <Field label={copy.tags} wide><input required value={tags} onChange={(event) => setTags(event.target.value)} placeholder={copy.tagsPlaceholder} /></Field>}
      </div></section>
      <section ref={scopeRef} className={dialog.section}><div className={dialog.scopeSummary}><span><strong>{caseCount(effectiveIds.length)} {copy.scope}</strong><small>{type === "dynamic" ? copy.dynamicHint : copy.staticHint}</small></span><button type="button" className={dialog.scopeToggle} data-expanded={showCases} aria-expanded={showCases} onClick={() => setShowCases((current) => !current)}>{showCases ? copy.hideCases : copy.reviewCases}<ChevronDown size={14} aria-hidden /></button></div>
      {showCases && <div className={dialog.picker}>
        <div className={dialog.pickerToolbar}><label className={dialog.search}><Search size={15} /><input aria-label={copy.searchAria} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label>{type === "static" && <div className={dialog.pickerActions}><button type="button" onClick={() => setCaseIds(Array.from(new Set([...caseIds, ...visibleCases.map((item) => item.id)])))}>{copy.selectVisible}</button><button type="button" onClick={() => setCaseIds((current) => current.filter((id) => !visibleCases.some((item) => item.id === id)))}>{copy.clearVisible}</button></div>}</div>
        <EmbeddedCaseList cases={previewCases} locale={locale} ariaLabel={copy.searchAria} emptyLabel={copy.noMatching} selectedIds={selectedIds} selectionDisabled={type === "dynamic"} onToggle={(id) => setCaseIds((current) => current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id])} maxHeight="min(47vh, 510px)" />
      </div>}
      {error && <FormError message={error} />}</section>
      </div>
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || effectiveIds.length === 0}><Save size={16} /> {submitting ? copy.saving : suite ? copy.save : copy.create}</button></div>
    </form>
  </Modal>;
}
