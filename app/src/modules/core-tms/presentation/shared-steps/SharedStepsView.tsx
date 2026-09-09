"use client";

import { transitionContent } from "../workspace/motion/transition/content-transition";
import { ContentSkeleton } from "../common/skeleton/ContentSkeleton";
import { Plus, Repeat2, Search, Trash2, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { emptySharedStepDraft, type SharedStepSummary, type SharedStepDraft } from "../../shared-steps/model/shared-step";
import type { useSharedSteps } from "../../shared-steps/state/useSharedSteps";
import { ArchiveSharedStepDialog } from "./archive/ArchiveSharedStepDialog";
import { SharedStepAttachmentEditor } from "./attachments/SharedStepAttachmentEditor";
import styles from "./sharedSteps.module.css";

type Resource = ReturnType<typeof useSharedSteps>;

export function SharedStepsView({ resource }: { resource: Resource }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<SharedStepDraft | null>(null);
  const [removing, setRemoving] = useState<SharedStepSummary | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const rows = useMemo(() => resource.items.filter((item) =>
    item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query, resource.items]);

  const beginEdit = async (id: string) => {
    setEditingId(id);
    const current = await resource.open(id);
    if (!current) { setEditingId(null); return; }
    transitionContent(() => setDraft({ title: current.current.title, items: current.current.items, changeNote: "" }));
  };
  if (draft) return <SharedStepAttachmentEditor draft={draft} resource={resource}
    current={editingId ? resource.selected : null} ru={ru} onChange={setDraft}
    onClose={() => transitionContent(() => { setDraft(null); setEditingId(null); resource.close(); })} />;

  return <section className={styles.view}>
    <header className={styles.header}>
      <div><h1>{ru ? "Общие шаги" : "Shared steps"}</h1>
        <p>{ru ? "Повторяемые сценарии проекта" : "Reusable project procedures"}</p></div>
      <button type="button" className={styles.primaryButton}
        onClick={() => { setEditingId(null); setDraft(emptySharedStepDraft()); }}>
        <Plus size={16} />{ru ? "Общий шаг" : "Shared step"}
      </button>
    </header>
    <div className={styles.toolbar} data-input-shell>
      <Search size={17} aria-hidden="true" />
      <input value={query} onChange={(event) => setQuery(event.target.value)}
        placeholder={ru ? "Поиск по названию" : "Search by title"} />
    </div>
    <div className={styles.list}>
      {resource.status === "loading" && !resource.items.length && <ContentSkeleton variant="list" label={ru ? "Загрузка общих шагов" : "Loading shared steps"} />}
      {resource.status === "error" && <div className={styles.state}><strong>{ru
        ? "Не удалось загрузить общие шаги" : "Could not load shared steps"}</strong>
        <button className={styles.secondaryButton} onClick={() => void resource.refresh()}>{ru ? "Повторить" : "Retry"}</button></div>}
      {resource.status !== "loading" && resource.status !== "error" && rows.length === 0 &&
        <div className={styles.empty}><span><Workflow size={26} /></span>
          <strong>{query ? (ru ? "Ничего не найдено" : "No matches")
            : (ru ? "Создайте первый общий шаг" : "Create the first shared step")}</strong>
          {!query && <button type="button" className={styles.secondaryButton}
            onClick={() => transitionContent(() => setDraft(emptySharedStepDraft()))}><Plus size={15} />{ru ? "Создать" : "Create"}</button>}
        </div>}
      {rows.map((item) => <div key={item.id} className={styles.row}>
        <button type="button" className={styles.rowOpen} onClick={() => void beginEdit(item.id)}>
        <span className={styles.rowIcon}><Workflow size={17} /></span>
        <span className={styles.rowTitle}><strong>{item.title}</strong><small>{ru
          ? `Версия ${item.currentRevision}` : `Revision ${item.currentRevision}`}</small></span>
        <span className={styles.rowMetric}><b>{item.itemCount}</b><small>{ru ? "шагов" : "steps"}</small></span>
        <span className={styles.rowMetric}><b>{item.usageCount}</b><small>{ru ? "использований" : "usages"}</small></span>
        <span className={styles.rowDate}>{new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", {
          day: "numeric", month: "short", year: "numeric" }).format(new Date(item.updatedAt))}</span>
        </button>
        <button type="button" className={styles.removeButton} disabled={!resource.archiveEnabled}
          aria-label={ru ? `Удалить общий шаг «${item.title}»` : `Remove shared step “${item.title}”`}
          title={ru ? "Удалить общий шаг" : "Remove shared step"} onClick={() => setRemoving(item)}>
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>)}
    </div>
    {removing && <ArchiveSharedStepDialog item={removing} resource={resource} ru={ru} onClose={() => setRemoving(null)} />}
  </section>;
}
