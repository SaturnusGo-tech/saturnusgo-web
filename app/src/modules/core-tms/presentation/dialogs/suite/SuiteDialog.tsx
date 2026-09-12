import { Check } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
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
import { useDrawerDismiss } from "../../common/drawer/useDrawerDismiss";
import { Modal } from "../../common/modal/Modal";
import { SelectionControls, useSelectionFilters } from "../../cases/selection/controls/SelectionControls";
import { SelectionTree } from "../../cases/selection/tree/SelectionTree";
import { SuiteEditableFields } from "./fields/SuiteEditableFields";
import { initialSuiteSelection, toggleSuiteScope } from "./state/suite-selection";
import { getSuiteDialogCopy } from "./copy";
import dialog from "./suite-dialog.module.css";

type Props = {
  projectId: string; projectName: string; cases: TestCaseSummary[]; folders: readonly RepositoryFolder[];
  suite?: Suite; suiteEtag?: string | null; offline: boolean; onClose: () => void;
  onSaved: (suite: Suite, etag: string | null) => void;
};
export function SuiteDialog(props: Props) {
  const http = useTmsHttpClient(); const { locale } = useTmsLocale(); const ru = locale === "ru";
  const copy = getSuiteDialogCopy(locale);
  const { closing, dismiss, panelRef } = useDrawerDismiss();
  const activeCases = useMemo(() => props.cases.filter(item => !item.archivedAt && item.projectId === props.projectId), [props.cases, props.projectId]);
  const [name, setName] = useState<string>(props.suite?.name ?? "");
  const [description, setDescription] = useState<string>(props.suite?.description ?? "");
  const [type, setType] = useState<Suite["type"]>(props.suite?.type ?? "static");
  const [caseIds, setCaseIds] = useState(() => initialSuiteSelection(props.suite, activeCases));
  const [tags, setTags] = useState((props.suite?.filter.tags ?? ["smoke"]).join(", "));
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("");
  const operation = useRef<PendingOperation | null>(null);
  const normalizedTags = tags.split(",").map(tag => tag.trim()).filter(Boolean);
  const membership = { projectId: props.projectId, type, caseIds, filter: { ...(props.suite?.type === "dynamic" ? props.suite.filter : {}), tags: normalizedTags } };
  const preview = useSuitePreview(activeCases, membership, props.folders);
  const effectiveIds = type === "dynamic" ? preview.cases.map(item => item.id) : caseIds;
  const filters = useSelectionFilters(type === "dynamic" ? preview.cases : activeCases);
  const selected = new Set(effectiveIds);
  const scope = (ids: readonly string[]) => setCaseIds(current => toggleSuiteScope(current, ids));
  const close = () => { if (!submitting) dismiss(props.onClose); };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (closing || submitting || preview.loading || preview.error || !name.trim() || effectiveIds.length === 0) return;
    setSubmitting(true); setError("");
    const signature = JSON.stringify({ suiteId: props.suite?.id, suiteEtag: props.suiteEtag, projectId: props.projectId,
      name: name.trim(), description: description.trim(), type, caseIds: type === "static" ? [...new Set(caseIds)] : [], tags: type === "dynamic" ? [...new Set(normalizedTags)] : [] });
    operation.current = resolvePendingOperation(operation.current, signature);
    try {
      const saved = await saveSuite({ http, suite: props.suite, suiteEtag: props.suiteEtag, projectId: props.projectId, name, description, type, caseIds,
        tags: normalizedTags, offline: props.offline, operationKey: operation.current.key });
      dismiss(() => props.onSaved(saved.data, saved.etag));
    } catch (caught) {
      setError(formatTmsMutationFailure(toTmsMutationFailure(caught), copy.error)); setSubmitting(false);
    }
  }
  return <Modal title={props.suite ? copy.configureTitle : copy.createTitle} onClose={close} panelClassName={dialog.panel} wide drawer>
    <form ref={element => { panelRef.current = element?.parentElement ?? null; if (element) element.inert = closing; }} onSubmit={submit} className={dialog.form}>
      <div className={dialog.body} aria-busy={submitting} inert={submitting ? true : undefined}>
        <SuiteEditableFields name={name} description={description} type={type} tags={tags} creating={!props.suite} ru={ru} retainedFilter={props.suite?.type === "dynamic" && type === "dynamic" ? props.suite.filter : undefined} folders={props.folders}
          onName={setName} onDescription={setDescription} onType={(value, restoring) => { if (!restoring && value === "static" && type === "dynamic") setCaseIds(preview.cases.map(item => item.id)); setType(value); }} onTags={setTags} />
        <section className={dialog.scopeSection} aria-label={ru ? "Состав сьюта" : "Suite membership"}>
          <SelectionControls state={filters} ru={ru} onSelectAll={type === "static" ? () => scope(filters.visible.map(item => item.id)) : undefined} />
          {preview.loading ? <RunCasesSkeleton /> : preview.error ? <button type="button" className={dialog.cancel} onClick={preview.retry}>{ru ? "Повторить загрузку состава" : "Retry loading membership"}</button> : <SelectionTree cases={filters.visible} folders={props.folders} selected={selected} ru={ru} selectable={type === "static"}
            onToggle={id => scope([id])} onScope={scope} onOpen={type === "dynamic" ? () => {} : undefined}
            heading={<><strong>{props.projectName}</strong><span>{filters.visible.length}</span></>} />}
          {!preview.loading && !preview.error && !filters.visible.length && <p className={dialog.hint}>{copy.noMatching}</p>}
        </section>
        {error && <FormError message={error} />}
      </div>
      <footer className={dialog.footer}><span>{ru ? "Выбрано кейсов" : "Selected cases"}: {effectiveIds.length}</span><div>
        <button type="button" className={dialog.cancel} disabled={submitting} onClick={close}>{copy.cancel}</button>
        <button className={dialog.saveButton} disabled={submitting || preview.loading || preview.error || !name.trim() || effectiveIds.length === 0}><Check size={16} />{submitting ? copy.saving : props.suite ? copy.save : copy.create}</button>
      </div></footer>
    </form>
  </Modal>;
}
