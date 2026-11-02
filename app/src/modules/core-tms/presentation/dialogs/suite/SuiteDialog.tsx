import { ArrowLeft } from "@openai/apps-sdk-ui/components/Icon";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Suite, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { saveSuite } from "../../../application/suites/saveSuite";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useSuitePreview } from "../../../suites/state/preview/useSuitePreview";
import { RunCasesSkeleton } from "../../runs/loading/RunCasesSkeleton";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { FormError } from "../../common/error/FormError";
import { SuiteCasePicker } from "./picker/SuiteCasePicker";
import { SuiteEditableFields } from "./fields/SuiteEditableFields";
import { initialSuiteSelection, toggleSuiteScope } from "./state/suite-selection";
import { getSuiteDialogCopy } from "./copy";
import shared from "../../suites/suites.module.css";
import css from "./suite-dialog.module.css";

type Props = {
  projectId: string; projectName: string; cases: TestCaseSummary[]; folders: readonly RepositoryFolder[];
  suite?: Suite; suiteEtag?: string | null; offline: boolean; onClose: () => void;
  onSaved: (suite: Suite, etag: string | null) => void;
};
/** Suite editing occupies the workspace stage, never a modal or drawer. */
export function SuiteDialog(props: Props) {
  const http = useTmsHttpClient(); const { locale } = useTmsLocale(); const ru = locale === "ru";
  const copy = getSuiteDialogCopy(locale); const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  const activeCases = useMemo(() => props.cases.filter(item => !item.archivedAt && item.projectId === props.projectId), [props.cases, props.projectId]);
  const [name, setName] = useState<string>(props.suite?.name ?? "");
  const [description, setDescription] = useState<string>(props.suite?.description ?? "");
  const [type, setType] = useState<Suite["type"]>(props.suite?.type ?? "static");
  const [caseIds, setCaseIds] = useState(() => props.suite ? initialSuiteSelection(props.suite, activeCases) : []);
  const [tags, setTags] = useState((props.suite ? props.suite.filter.tags ?? [] : ["smoke"]).join(", "));
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("");
  const operation = useRef<PendingOperation | null>(null);
  const normalizedTags = tags.split(",").map(tag => tag.trim()).filter(Boolean);
  const membership = { projectId: props.projectId, type, caseIds, filter: { ...(props.suite?.type === "dynamic" ? props.suite.filter : {}), tags: normalizedTags } };
  const preview = useSuitePreview(activeCases, membership, props.folders);
  const effectiveIds = type === "dynamic" ? preview.cases.map(item => item.id) : caseIds;
  const selected = new Set(effectiveIds);
  const scope = (ids: readonly string[]) => setCaseIds(current => toggleSuiteScope(current, ids));
  const disabled = submitting || preview.loading || preview.error || !name.trim() || !effectiveIds.length;
  async function submit(event: FormEvent) {
    event.preventDefault(); if (disabled) return;
    setSubmitting(true); setError("");
    const signature = JSON.stringify({ suiteId: props.suite?.id, suiteEtag: props.suiteEtag, projectId: props.projectId,
      name: name.trim(), description: description.trim(), type, caseIds: type === "static" ? [...new Set(caseIds)] : [], tags: type === "dynamic" ? [...new Set(normalizedTags)] : [] });
    operation.current = resolvePendingOperation(operation.current, signature);
    try {
      const saved = await saveSuite({ http, suite: props.suite, suiteEtag: props.suiteEtag, projectId: props.projectId, name, description, type, caseIds,
        tags: normalizedTags, offline: props.offline, operationKey: operation.current.key });
      props.onSaved(saved.data, saved.etag);
    } catch (caught) {
      setError(formatTmsMutationFailure(toTmsMutationFailure(caught), copy.error)); setSubmitting(false);
    }
  }
  return <section className={shared.workspace} aria-label={props.suite ? copy.configureTitle : copy.createTitle}>
    <form onSubmit={submit} className={css.page} aria-busy={submitting}>
      <button type="button" className={css.back} disabled={submitting} onClick={props.onClose}><ArrowLeft width={16} height={16} />{ru ? "Тест-сьюты" : "Test suites"}</button>
      <header className={css.header}>
        <div><h1 ref={title} tabIndex={-1}>{props.suite ? copy.configureTitle : copy.createTitle}</h1><p>{copy.subtitle}</p></div>
        <div className={css.actions}><button type="button" className={css.cancel} disabled={submitting} onClick={props.onClose}>{copy.cancel}</button>
          <button type="submit" className={shared.primary} disabled={disabled}>{submitting ? copy.saving : props.suite ? copy.save : copy.create}</button></div>
      </header>
      <div ref={element => { if (element) element.inert = submitting; }}>
        <SuiteEditableFields name={name} description={description} type={type} tags={tags} creating={!props.suite} ru={ru} retainedFilter={props.suite?.type === "dynamic" && type === "dynamic" ? props.suite.filter : undefined} folders={props.folders}
          onName={setName} onDescription={setDescription} onType={value => { if (value === "static" && type === "dynamic") setCaseIds(preview.cases.map(item => item.id)); setType(value); }} onTags={setTags} />
        <section className={css.scopeSection} aria-label={ru ? "Состав сьюта" : "Suite membership"}>
          <header className={css.scopeHeader}><h2>{type === "dynamic" ? (ru ? "Подходящие кейсы" : "Matching cases") : (ru ? "Выберите кейсы" : "Choose cases")}</h2>
            <span aria-live="polite">{effectiveIds.length} {ru ? "в наборе" : "in suite"}</span></header>
          {preview.loading ? <RunCasesSkeleton /> : preview.error ? <div role="alert"><p>{ru ? "Не удалось проверить состав. Выбранные кейсы сохранены в черновике." : "Could not resolve membership. Your selection is still in this draft."}</p><button type="button" className={css.cancel} onClick={preview.retry}>{ru ? "Повторить" : "Retry"}</button></div>
            : <SuiteCasePicker cases={type === "dynamic" ? preview.cases : activeCases} folders={props.folders} selected={selected}
              projectName={props.projectName} ru={ru} readonly={type === "dynamic"} onToggle={id => scope([id])} onScope={scope} />}
          {!effectiveIds.length && <p className={css.hint}>{ru ? "Добавьте хотя бы один кейс, чтобы сохранить набор." : "Add at least one case to save this suite."}</p>}
        </section>
      </div>
      {error && <FormError message={error} />}
    </form>
  </section>;
}
