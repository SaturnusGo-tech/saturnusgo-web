"use client";

import { ErrorToast } from "../../../../common/error/ErrorToast";
import type { ReactNode } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { AttachmentLink } from "../../../../../attachments/presentation/link/AttachmentLink";
import { useCaseAttachmentDraft } from "../../attachments/CaseAttachmentDraftContext";
import { fileTransferHandlers } from "../../attachments/input/fileTransfer";
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
    transfer: fileTransferHandlers(draft?.enabled && !draft.locked ? addFiles : undefined),
  };
}

export function ScenarioAttachmentControls(props: DraftAttachmentsProps & {prefix?: ReactNode}) {
  const { locale } = useTmsLocale();
  const attachments = useScenarioAttachments(props);
  if (!attachments.enabled) return props.prefix ?? null;
  return <div className={css.attachmentControls}>
    {props.prefix}
    <MarkdownAttachmentButton locale={locale} onFiles={attachments.addFiles}
      text={locale === "ru" ? "Прикрепить файл" : "Attach file"} />
    {attachments.pending.length > 0 && attachments.remove && <MarkdownPendingAttachments
      locale={locale}
      entries={attachments.pending}
      onRemove={attachments.remove}
      presentation="media"
    />}
    <ErrorToast message={attachments.problem} />
  </div>;
}

export function SavedScenarioAttachments({ ids }: { ids?: string[] }) {
  if (!ids || ids.length === 0) return null;
  return <div className={css.savedAttachments}>
    {ids.map((id) => <AttachmentLink key={id} attachmentId={id} presentation="media" />)}
  </div>;
}

export function PendingScenarioAttachments({ stepId }: { stepId: string }) {
  const draft = useCaseAttachmentDraft();
  const { locale } = useTmsLocale();
  if (!draft) return null;
  return <MarkdownPendingAttachments locale={locale} entries={draft.entries.filter((entry) => entry.stepId === stepId)}
    onRemove={draft.remove} presentation="media" />;
}
