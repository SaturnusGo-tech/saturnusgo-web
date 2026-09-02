"use client";

import MDEditor from "@uiw/react-md-editor/nohighlight";
import dynamic from "next/dynamic";
import { useCallback } from "react";
import { useColorMode } from "../../../../../../shared/_hooks/useColorMode";
import { filesFromClipboard } from "../../../../application/evidence/case/pendingCaseAttachment";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useCaseAttachmentDraft } from "../attachments/CaseAttachmentDraftContext";
import css from "./markdownField.module.css";

type Props = {
  value: string;
  label: string;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
  compact?: boolean;
  emptyLabel?: string;
  attachmentKey?: string;
  attachmentStepId?: string;
  allowAttachments?: boolean;
};

const WysiwygMarkdownEditor = dynamic(
  () => import("./InitializedMarkdownEditor"),
  { ssr: false, loading: () => <div className={css.editorLoading} aria-hidden="true" /> },
);

function isSafeUrl(url: string) {
  const value = url.trim();
  return /^(https?:|mailto:|tel:)/i.test(value)
    || /^(#|\/|\.\/|\.\.\/)/.test(value);
}

export function MarkdownField(props: Props) {
  const { theme } = useColorMode();
  const { locale } = useTmsLocale();
  const attachments = useCaseAttachmentDraft();
  const addFilesToDraft = attachments?.add;
  const colorMode = theme === "dark" ? "dark" : "light";
  const attachmentEnabled = props.allowAttachments !== false && Boolean(
    attachments?.enabled && props.attachmentKey,
  );
  const addAttachmentFiles = useCallback((files: File[]) => {
    if (props.attachmentKey) addFilesToDraft?.(
      props.attachmentKey, files, props.attachmentStepId,
    );
  }, [addFilesToDraft, props.attachmentKey, props.attachmentStepId]);
  if (!props.onChange) {
    if (!props.value.trim()) {
      return <p className={css.empty}>{props.emptyLabel}</p>;
    }
    return <MDEditor.Markdown
      className={css.rendered}
      source={props.value}
      skipHtml
      urlTransform={(url) => isSafeUrl(url) ? url : ""}
      wrapperElement={{ "data-color-mode": colorMode }}
    />;
  }
  const addFiles = attachmentEnabled ? addAttachmentFiles : undefined;
  const pending = attachmentEnabled
    ? attachments?.entries.filter((entry) => entry.fieldKey === props.attachmentKey) ?? []
    : [];
  const draftProblem = attachments?.problem;
  let attachmentProblem = "";
  if (draftProblem && draftProblem.fieldKey === props.attachmentKey) {
    attachmentProblem = draftProblem.message;
  }
  return <div className={css.field} data-color-mode={colorMode} role="group" aria-label={props.label}
    onPasteCapture={(event) => {
      if (!addFiles) return;
      const files = filesFromClipboard(event.clipboardData);
      if (files.length === 0) return;
      event.preventDefault();
      addFiles(files);
    }}>
    <WysiwygMarkdownEditor
      markdown={props.value}
      label={props.label}
      locale={locale}
      compact={props.compact}
      autoFocus={props.autoFocus}
      validateUrl={isSafeUrl}
      onChange={props.onChange}
      pendingAttachments={pending}
      onAttachmentFiles={addFiles}
      onRemoveAttachment={attachmentEnabled ? attachments?.remove : undefined}
    />
    {attachmentEnabled && attachmentProblem && <span className={css.attachmentError} role="alert">
      {attachmentProblem}
    </span>}
  </div>;
}
