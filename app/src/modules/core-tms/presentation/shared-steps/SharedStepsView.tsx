"use client";

import { ErrorToast } from "../common/error/ErrorToast";
import { transitionContent } from "../workspace/motion/transition/content-transition";
import { DeferredPane } from "../common/loading/feedback/DeferredPane";
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
import { SharedStepSectionFilter } from "./selection/SharedStepSectionFilter";
import { filterSharedSteps } from "../../shared-steps/model/catalog/shared-step-catalog";
import styles from "./sharedSteps.module.css";

type Resource = ReturnType<typeof useSharedSteps>;

export function SharedStepsView({ resource, folders = [] }: { resource: Resource; folders?: readonly { id: string; path: string }[] }) {
  const { locale } = useTmsLocale(), ru = locale === "ru";
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [draft, setDraft] = useState<SharedStepDraft | null>(null);
  const [removing, setRemoving] = useState<SharedStepSummary | null>(null);
  const [editing, setEditing] = useState<SharedStep | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  const rows = filterSharedSteps(resource.items, query, section);
  const beginEdit = async (id: string) => {
    const token = ++request.current; setOpeningId(id);
    const current = await resource.open(id);
    if (token !== request.current) return;
    setOpeningId(null);
    if (!current) return;
    transitionContent(() => { if (token !== request.current) return;
      setEditing(current); setDraft({ folderId: current.folderId, title: current.current.title, items: current.current.items, changeNote: "" }); });
  };
  const create = () => {
    request.current++; setOpeningId(null);
    transitionContent(() => { setEditing(null); setDraft(emptySharedStepDraft()); });
  };
  if (draft) return <SharedStepAttachmentEditor draft={draft} resource={resource} folders={folders}
    current={editing} ru={ru} onChange={setDraft}
    onClose={() => transitionContent(() => { setDraft(null); setEditing(null); resource.close(); })} />;

  return <section className={styles.view}>
    <div className={styles.page}>
      <header className={styles.header}>
        <div><h1>{ru ? "Общие шаги" : "Shared steps"}<span>{resource.items.length || ""}</span></h1>
          <p>{ru ? "Повторяемые сценарии проекта" : "Reusable project procedures"}</p></div>
        <div className={styles.headerActions}>
          <div className={styles.locationSearch}>
            {resource.items.length > 0 && <SharedStepSectionFilter items={resource.items} value={section} ru={ru} onChange={setSection} />}
            <SharedStepSearch value={query} onChange={setQuery} ru={ru} />
          </div>
          <button type="button" className={styles.primaryButton} onClick={create}><Plus size={16} />{ru ? "Общий шаг" : "Shared step"}</button>
        </div>
      </header>
      {resource.status === "error" ? <ErrorToast message={ru ? "Не удалось загрузить общие шаги" : "Could not load shared steps"} retryLabel={ru ? "Повторить" : "Retry"} onRetry={resource.refresh} />
        : <DeferredPane pending={resource.status === "loading" && !resource.items.length} variant="list" label={ru ? "Загрузка общих шагов" : "Loading shared steps"}>
          {rows.length > 0 && <SharedStepList items={rows} ru={ru} locale={locale} archiveEnabled={resource.archiveEnabled}
            openingId={openingId} onOpen={id => void beginEdit(id)} onRemove={setRemoving} />}
          {resource.status !== "loading" && rows.length === 0 &&
            <SharedStepEmpty searching={Boolean(query.trim()) || section !== "all"} ru={ru} onReset={() => { setQuery(""); setSection("all"); }} />}
        </DeferredPane>}
    </div>
    {removing && <ArchiveSharedStepDialog item={removing} resource={resource} ru={ru} onClose={() => setRemoving(null)} />}
  </section>;
}
