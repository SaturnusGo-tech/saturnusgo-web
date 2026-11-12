import { ErrorToast } from "../../presentation/common/error/ErrorToast";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useProductDocsWorkspace } from "../composition/context/ProductDocsContext";
import type { ProductDocRequirements } from "../domain/product-docs";
import { notifyCaseRequirementsChanged, subscribeCaseRequirementsChanged } from "./save/case-requirements-events";
import { CaseRequirementLinks } from "./case/CaseRequirementLinks";
import { CaseRequirementPicker } from "./case/CaseRequirementPicker";
import styles from "./requirements.module.css";

type Subject =
  | { caseId: string; readOnly?: boolean; disabled?: boolean }
  | { runId: string; itemId: string };

export function Requirements({projectId, subject, ru}: {projectId?: string; subject: Subject; ru: boolean}) {
  const docs = useProductDocsWorkspace();
  if (!docs || projectId !== docs.scope.projectId) return null;
  const key = "caseId" in subject ? subject.caseId : `${subject.runId}:${subject.itemId}`;
  return <ScopedRequirements key={key} docs={docs} subject={subject} ru={ru} />;
}

function ScopedRequirements({docs, subject, ru}: {
  docs: NonNullable<ReturnType<typeof useProductDocsWorkspace>>;
  subject: Subject;
  ru: boolean;
}) {
  const {api, scope} = docs;
  const caseId = "caseId" in subject ? subject.caseId : undefined;
  const runId = "runId" in subject ? subject.runId : undefined;
  const itemId = "itemId" in subject ? subject.itemId : undefined;
  const [result, setResult] = useState<ProductDocRequirements>();
  const [failed, setFailed] = useState(false);
  const [mutationFailed, setMutationFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const canLink = Boolean(caseId && !("readOnly" in subject && subject.readOnly) && result?.canEdit);
  const linkDisabled = "disabled" in subject && Boolean(subject.disabled);

  useEffect(() => {
    if (linkDisabled) setPickerOpen(false);
  }, [linkDisabled]);

  useEffect(() => {
    if (!caseId) return;
    return subscribeCaseRequirementsChanged((changed, changedCaseId) => {
      if (changedCaseId === caseId && changed.workspaceId === scope.workspaceId && changed.projectId === scope.projectId) {
        setReload(value => value + 1);
      }
    });
  }, [scope, caseId]);

  useEffect(() => {
    const controller = new AbortController();
    const load = caseId ? api.listCaseRequirements(scope, caseId, {signal: controller.signal})
      : api.listRunRequirements(scope, runId!, itemId!, {signal: controller.signal});
    load.then(value => {
      if (!controller.signal.aborted) { setResult(value); setFailed(false); }
    }, () => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [api, scope, caseId, runId, itemId, reload]);

  async function more() {
    const cursor = result?.nextCursor;
    if (!result || !cursor || moreBusy) return;
    setMoreBusy(true);
    setFailed(false);
    try {
      const page = caseId ? await api.listCaseRequirements(scope, caseId, {cursor})
        : await api.listRunRequirements(scope, runId!, itemId!, {cursor});
      setResult({...page, requirements: [...result.requirements, ...page.requirements]});
    } catch { setFailed(true); }
    finally { setMoreBusy(false); }
  }

  async function update(docId: string, sectionId?: string | null) {
    if (!caseId || !canLink || linkDisabled || busy || moreBusy) return;
    setBusy(true);
    setMutationFailed(false);
    try {
      if (sectionId === undefined) await api.unlinkRequirement(scope, caseId, docId);
      else await api.linkRequirement(scope, caseId, docId, sectionId);
      setPickerOpen(false);
      notifyCaseRequirementsChanged(scope, caseId);
    } catch { setMutationFailed(true); }
    finally { setBusy(false); }
  }

  const content = <>
    <ErrorToast message={failed ? (ru ? "Не удалось загрузить требования." : "Could not load requirements.") : null}
      retryLabel={ru ? "Повторить" : "Retry"} onRetry={() => { setFailed(false); setReload(value => value + 1); }} />
    <ErrorToast message={mutationFailed && !pickerOpen ? (ru ? "Не удалось изменить связь." : "Could not update the link.") : null} />
    {result?.requirements.length ? caseId ? <CaseRequirementLinks requirements={result.requirements} ru={ru}
      onOpen={(requirement, source) => docs.open({
        docId: requirement.docId, sectionId: requirement.sectionId ?? undefined,
      }, source)}
      onRemove={canLink ? (docId) => void update(docId) : undefined}
      disabled={linkDisabled || busy || moreBusy} /> : <ul className={styles.list}>
      {result.requirements.map(requirement => <li key={requirement.docId}>
        <button className={styles.article} type="button" onClick={event => docs.open({
          docId: requirement.docId, sectionId: requirement.sectionId ?? undefined,
          version: runId ? requirement.version : undefined,
        }, event.currentTarget)}>
          <FileText size={17} aria-hidden />
          <span>{requirement.title}{requirement.sectionTitle && <small>{requirement.sectionTitle}</small>}</span>
          <small>{ru ? "Версия" : "Version"} {requirement.version}</small>
        </button>
      </li>)}
    </ul> : caseId && !failed && !canLink && result && <span>{ru ? "Не привязана" : "None linked"}</span>}
    {result?.nextCursor && <button type="button" className={styles.more} disabled={moreBusy || busy} onClick={() => void more()}>{ru ? "Показать ещё" : "Show more"}</button>}
    {canLink && <CaseRequirementPicker api={api} scope={scope} ru={ru} disabled={linkDisabled || busy || moreBusy}
      open={pickerOpen && !linkDisabled} linkFailed={mutationFailed} onOpenChange={open => { setPickerOpen(open); setMutationFailed(false); }}
      onLink={({docId, sectionId}) => void update(docId, sectionId)} />}
  </>;
  if (caseId) return <div className={styles.field} data-documentation-field data-testid="case-requirements">
    <dt>{ru ? "Документация" : "Documentation"}</dt><dd>
      {!result && !failed && <span role="status">{ru ? "Загрузка…" : "Loading…"}</span>}
      {content}
    </dd>
  </div>;
  if (!failed && !result?.requirements.length) return null;
  const heading = ru ? "Требования в снимке прогона" : "Requirements in this run";
  return <section className={styles.section} aria-label={heading} data-testid="run-requirements">
    <header className={styles.heading}><h2>{heading}</h2></header>{content}
  </section>;
}
