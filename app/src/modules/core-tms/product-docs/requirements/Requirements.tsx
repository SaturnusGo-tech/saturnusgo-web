import { useEffect, useState } from "react";
import { FileText, Plus, X } from "lucide-react";
import { useProductDocsWorkspace } from "../composition/context/ProductDocsContext";
import type { ProductDocRequirements } from "../domain/product-docs";
import { RequirementPicker } from "./RequirementPicker";
import styles from "./requirements.module.css";

type Subject =
  | { caseId: string; readOnly?: boolean }
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
    if (!caseId || !canLink || busy || moreBusy) return;
    setBusy(true);
    setMutationFailed(false);
    try {
      if (sectionId === undefined) await api.unlinkRequirement(scope, caseId, docId);
      else await api.linkRequirement(scope, caseId, docId, sectionId);
      setPickerOpen(false);
      setReload(value => value + 1);
    } catch { setMutationFailed(true); }
    finally { setBusy(false); }
  }

  if (!failed && !canLink && !result?.requirements.length) return null;
  return <section className={styles.section} aria-label={ru ? "Требования" : "Requirements"} data-testid={runId ? "run-requirements" : "case-requirements"}>
    <header className={styles.heading}>
      <h2>{runId ? (ru ? "Требования в снимке прогона" : "Requirements in this run") : (ru ? "Требования" : "Requirements")}</h2>
      {canLink && !pickerOpen && <button type="button" onClick={() => { setMutationFailed(false); setPickerOpen(true); }} disabled={busy || moreBusy}>
        <Plus size={15} aria-hidden />{ru ? "Связать" : "Link page"}
      </button>}
    </header>
    {failed && <div className={styles.feedback} role="alert">
      <span>{ru ? "Не удалось загрузить требования." : "Could not load requirements."}</span>
      <button type="button" onClick={() => { setFailed(false); setReload(value => value + 1); }}>{ru ? "Повторить" : "Retry"}</button>
    </div>}
    {mutationFailed && <p className={styles.feedback} role="alert">{ru ? "Не удалось изменить связь." : "Could not update the link."}</p>}
    {result?.requirements.length ? <ul className={styles.list}>
      {result.requirements.map(requirement => <li key={requirement.docId}>
        <button className={styles.article} type="button" onClick={event => docs.open({
          docId: requirement.docId, sectionId: requirement.sectionId ?? undefined,
          version: runId ? requirement.version : undefined,
        }, event.currentTarget)}>
          <FileText size={17} aria-hidden />
          <span>{requirement.title}{requirement.sectionTitle && <small>{requirement.sectionTitle}</small>}</span>
          {runId && <small>{ru ? "Версия" : "Version"} {requirement.version}</small>}
        </button>
        {canLink && <button type="button" className={styles.remove} aria-label={ru ? `Убрать связь с «${requirement.title}»` : `Unlink ${requirement.title}`}
          title={ru ? "Убрать связь" : "Unlink page"} disabled={busy || moreBusy} onClick={() => void update(requirement.docId)}><X size={15} aria-hidden /></button>}
      </li>)}
    </ul> : canLink && !pickerOpen && <p className={styles.feedback}>{ru ? "Свяжите кейс с правилом продукта." : "Link the product rule this case covers."}</p>}
    {result?.nextCursor && <button type="button" className={styles.more} disabled={moreBusy || busy} onClick={() => void more()}>{ru ? "Показать ещё" : "Show more"}</button>}
    {pickerOpen && canLink && <RequirementPicker api={api} scope={scope} ru={ru} disabled={busy || moreBusy} onLink={(docId, sectionId) => void update(docId, sectionId)}
      onClose={() => { setPickerOpen(false); setMutationFailed(false); }} />}
  </section>;
}
