"use client";

import { transitionContent } from "../workspace/motion/transition/content-transition";
import { ContentSkeleton } from "../common/skeleton/ContentSkeleton";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { emptySharedStepDraft, type SharedStepSummary, type SharedStepDraft, type SharedStep } from "../../shared-steps/model/shared-step";
import type { useSharedSteps } from "../../shared-steps/state/useSharedSteps";
import { ArchiveSharedStepDialog } from "./archive/ArchiveSharedStepDialog";
import { SharedStepAttachmentEditor } from "./attachments/SharedStepAttachmentEditor";
import { SharedStepList } from "./catalog/SharedStepList";
import { SharedStepSearch } from "./catalog/SharedStepSearch";
import { SharedStepEmpty } from "./empty/SharedStepEmpty";
import styles from "./sharedSteps.module.css";

type Resource = ReturnType<typeof useSharedSteps>;

export function SharedStepsView({ resource }: { resource: Resource }) {
  const { locale } = useTmsLocale(), ru = locale === "ru";
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<SharedStepDraft | null>(null);
  const [removing, setRemoving] = useState<SharedStepSummary | null>(null);
  const [editing, setEditing] = useState<SharedStep | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  const rows = resource.items.filter(item =>
    item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const beginEdit = async (id: string) => {
    const token = ++request.current; setOpeningId(id);
    const current = await resource.open(id);
    if (token !== request.current) return;
    setOpeningId(null);
    if (!current) return;
    transitionContent(() => { if (token !== request.current) return;
      setEditing(current); setDraft({ title: current.current.title, items: current.current.items, changeNote: "" }); });
  };
  const create = () => {
    request.current++; setOpeningId(null);
    transitionContent(() => { setEditing(null); setDraft(emptySharedStepDraft()); });
  };
  if (draft) return <SharedStepAttachmentEditor draft={draft} resource={resource}
    current={editing} ru={ru} onChange={setDraft}
    onClose={() => transitionContent(() => { setDraft(null); setEditing(null); resource.close(); })} />;

  return <section className={styles.view}>
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1>{ru ? "Общие шаги" : "Shared steps"}<span>{resource.items.length || ""}</span></h1>
          <p>{ru ? "Повторяемые сценарии проекта" : "Reusable project procedures"}</p></div>
        <div className={styles.headerActions}><SharedStepSearch value={query} onChange={setQuery} ru={ru} />
          <button type="button" className={styles.primaryButton} onClick={create}><Plus size={16} />{ru ? "Общий шаг" : "Shared step"}</button>
        </div>
      </header>
      {resource.status === "loading" && !resource.items.length && <ContentSkeleton variant="list" label={ru ? "Загрузка общих шагов" : "Loading shared steps"} />}
      {resource.status === "error" && <div className={styles.state} role="alert"><strong>{ru ? "Не удалось загрузить общие шаги" : "Could not load shared steps"}</strong>
        <button type="button" className={styles.secondaryButton} onClick={() => void resource.refresh()}>{ru ? "Повторить" : "Retry"}</button></div>}
      {resource.status !== "error" && rows.length > 0 && <SharedStepList items={rows} ru={ru} locale={locale} archiveEnabled={resource.archiveEnabled}
        openingId={openingId} onOpen={id => void beginEdit(id)} onRemove={setRemoving} />}
      {resource.status !== "loading" && resource.status !== "error" && rows.length === 0 &&
        <SharedStepEmpty searching={Boolean(query.trim())} ru={ru} onReset={() => setQuery("")} />}
    </div>
    {removing && <ArchiveSharedStepDialog item={removing} resource={resource} ru={ru} onClose={() => setRemoving(null)} />}
  </section>;
}
