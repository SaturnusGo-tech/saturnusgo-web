"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { appendPendingCaseAttachments, type PendingCaseAttachment } from "../../../../application/evidence/case/pendingCaseAttachment";
import type { TmsLocale } from "../../../../localization/model/locale";

type DraftContext = {
  enabled: boolean;
  entries: PendingCaseAttachment[];
  problem: { fieldKey: string; message: string } | null;
  add: (fieldKey: string, files: File[], stepId?: string) => void;
  remove: (id: string) => void;
  removeFields: (predicate: (fieldKey: string) => boolean) => void;
};

const Context = createContext<DraftContext | null>(null);

export function CaseAttachmentDraftProvider(props: {
  locale: TmsLocale;
  enabled: boolean;
  entries: PendingCaseAttachment[];
  validStepIds: ReadonlySet<string>;
  onEntries: (entries: PendingCaseAttachment[]) => void;
  children: React.ReactNode;
}) {
  const entriesRef = useRef(props.entries);
  const [problem, setProblem] = useState<DraftContext["problem"]>(null);
  useEffect(() => { entriesRef.current = props.entries; }, [props.entries]);
  useEffect(() => {
    const next = entriesRef.current.filter(({ stepId }) => !stepId || props.validStepIds.has(stepId));
    if (next.length === entriesRef.current.length) return;
    entriesRef.current = next;
    props.onEntries(next);
  }, [props.validStepIds, props.onEntries]);

  const update = useCallback((entries: PendingCaseAttachment[]) => {
    entriesRef.current = entries;
    props.onEntries(entries);
  }, [props.onEntries]);
  const add = useCallback((fieldKey: string, files: File[], stepId?: string) => {
    const result = appendPendingCaseAttachments(entriesRef.current, { fieldKey, files, stepId });
    update(result.entries);
    setProblem(result.rejected > 0 ? { fieldKey, message: props.locale === "ru"
      ? "Часть файлов не добавлена: дубликат или превышен лимит 20 вложений."
      : "Some files were not added: duplicate or the 20-file limit was reached." } : null);
  }, [props.locale, update]);
  const remove = useCallback((id: string) => {
    update(entriesRef.current.filter((entry) => entry.id !== id));
    setProblem(null);
  }, [update]);
  const removeFields = useCallback((predicate: (fieldKey: string) => boolean) => {
    update(entriesRef.current.filter((entry) => !predicate(entry.fieldKey)));
    setProblem(null);
  }, [update]);
  const value = useMemo<DraftContext>(() => ({
    enabled: props.enabled, entries: props.entries, problem, add, remove, removeFields,
  }), [props.enabled, props.entries, problem, add, remove, removeFields]);
  return <Context.Provider value={value}>{props.children}</Context.Provider>;
}

export function useCaseAttachmentDraft() { return useContext(Context); }
