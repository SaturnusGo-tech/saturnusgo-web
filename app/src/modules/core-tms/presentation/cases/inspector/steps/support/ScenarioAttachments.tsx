"use client";

import type { ClipboardEvent } from "react";
import { filesFromClipboard } from "../../../../../application/evidence/case/pendingCaseAttachment";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { AttachmentLink } from "../../../../../attachments/presentation/link/AttachmentLink";
import { useCaseAttachmentDraft } from "../../attachments/CaseAttachmentDraftContext";
import {
  MarkdownAttachmentButton,
  MarkdownPendingAttachments,
} from "../../markdown/attachments/MarkdownAttachmentUi";
import css from "../scenarioSteps.module.css";

type DraftAttachmentsProps = {
  fieldKey: string;
  stepId?: string;
};

export function useScenarioAttachments({ fieldKey, stepId }: DraftAttachmentsProps) {
  const draft = useCaseAttachmentDraft();
  const addFiles = (files: File[]) => draft?.add(fieldKey, files, stepId);
  return {
    enabled: Boolean(draft?.enabled),
    pending: draft?.entries.filter((entry) => entry.fieldKey === fieldKey) ?? [],
    problem: draft?.problem?.fieldKey === fieldKey ? draft.problem.message : "",
    addFiles,
    remove: draft?.remove,
    paste(event: ClipboardEvent<HTMLTextAreaElement>) {
      if (!draft?.enabled) return false;
      const files = filesFromClipboard(event.clipboardData);
      if (files.length === 0) return false;
      event.preventDefault();
      draft.add(fieldKey, files, stepId);
      return true;
    },
  };
}

export function ScenarioAttachmentControls(props: DraftAttachmentsProps) {
  const { locale } = useTmsLocale();
  const attachments = useScenarioAttachments(props);
  if (!attachments.enabled) return null;
  return <div className={css.attachmentControls}>
    <MarkdownAttachmentButton locale={locale} onFiles={attachments.addFiles} />
    <span className={css.attachmentHint}>
      {locale === "ru" ? "Прикрепить файл" : "Attach file"}
    </span>
    {attachments.pending.length > 0 && attachments.remove && <MarkdownPendingAttachments
      locale={locale}
      entries={attachments.pending}
      onRemove={attachments.remove}
      presentation="media"
    />}
    {attachments.problem && <span className={css.attachmentError} role="alert">
      {attachments.problem}
    </span>}
  </div>;
}

export function SavedScenarioAttachments({ ids }: { ids?: string[] }) {
  if (!ids || ids.length === 0) return null;
  return <div className={css.savedAttachments}>
    {ids.map((id) => <AttachmentLink key={id} attachmentId={id} presentation="media" />)}
  </div>;
}
