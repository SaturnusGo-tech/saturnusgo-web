"use client";

import { ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocDetail, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import { useProductDocRelatedCases } from "../../state/related-cases/useProductDocRelatedCases";
import { ProductDocRelatedCasesDrawer } from "./ProductDocRelatedCasesDrawer";
import styles from "./related-cases.module.css";

type Props = {
  api: ProductDocsApi; scope: ProductDocScope; document: ProductDocDetail; locale: TmsLocale;
  projectName?: string; editable?: boolean; disabled?: boolean;
  onOpenCase?(location: { projectId: string; caseId: string }): void;
};

export function ProductDocRelatedCases(props: Props) {
  const { api, scope, document, locale, projectName, disabled, onOpenCase } = props;
  const ru = locale === "ru";
  const editable = Boolean(props.editable && document.canEdit && !document.archivedAt);
  const [open, setOpen] = useState(false), [selecting, setSelecting] = useState(false);
  const state = useProductDocRelatedCases(api, scope, document.id,
    editable || document.version === null ? document.draftVersion : undefined);
  const cases = state.status === "ready" ? state.data : [];
  const label = ru ? "Связанные кейсы" : "Related Cases";
  function show(select = false) {
    if (state.status === "error") state.retry();
    setSelecting(select); setOpen(true);
  }
  return <section className={styles.property} aria-label={label} data-doc-related-cases>
    <h2><button type="button" className={styles.propertyTitle} aria-haspopup="dialog" aria-expanded={open}
      aria-label={ru ? "Все связанные кейсы" : "Show all related cases"} onClick={() => show()}>{label}</button></h2>
    {state.status === "loading" && <span className={styles.hint} role="status">{ru ? "Загрузка…" : "Loading…"}</span>}
    {state.status === "error" && <span className={styles.hint}>{ru ? "Связи недоступны" : "Links unavailable"}</span>}
    {state.status === "ready" && <>
      <div className={styles.preview}>
        {cases.slice(0, 2).map(item => <button type="button" key={item.caseId} className={styles.caseLink}
          data-related-case-link title={item.title} disabled={!onOpenCase} onClick={() => onOpenCase?.({ projectId: scope.projectId, caseId: item.caseId })}>
          <ListChecks size={14} aria-hidden="true" /><span>{item.title}</span>
        </button>)}
        {cases.length > 0 && <button type="button" className={styles.count} aria-haspopup="dialog" aria-expanded={open}
          aria-label={`${ru ? "Все связанные кейсы" : "Show all related cases"}: ${cases.length}`}
          onClick={() => show()}>{cases.length}</button>}
        {!cases.length && <span className={styles.hint}>{ru ? "Нет связанных кейсов" : "No related cases"}</span>}
      </div>
      {editable && <button type="button" className={styles.textAction} disabled={disabled || state.busy}
        aria-label={ru ? "Добавить кейсы или папки" : "Add cases or folders"} aria-haspopup="dialog" aria-expanded={open && selecting}
        onClick={() => show(true)}><Plus size={13} aria-hidden="true" />{ru ? "Добавить" : "Add"}</button>}
    </>}
    <ProductDocRelatedCasesDrawer open={open} selecting={selecting} cases={cases} scope={scope} projectName={projectName ?? ""}
      ru={ru} editable={editable} busy={Boolean(disabled || state.busy)} saveFailed={state.saveFailed}
      loading={state.status === "loading"} loadFailed={state.status === "error"} onSelect={setSelecting} onClose={() => setOpen(false)} onSave={state.save}
      onOpenCase={onOpenCase && (caseId => { setOpen(false); onOpenCase({ projectId: scope.projectId, caseId }); })} />
  </section>;
}
