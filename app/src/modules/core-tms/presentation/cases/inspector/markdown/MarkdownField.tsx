"use client";

import MDEditor from "@uiw/react-md-editor/nohighlight";
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect } from "react";
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
  loadMarkdownEditor,
  { ssr: false, loading: () => <MarkdownEditorLoadingFallback /> },
);

type LoadingEditorState = {
  value: string;
  label: string;
  locale: "en" | "ru";
  compact: boolean;
  withAttachments: boolean;
  autoFocus: boolean;
  onChange: (value: string) => void;
};

const LoadingEditorContext = createContext<LoadingEditorState | null>(null);

function loadMarkdownEditor() {
  return import("./InitializedMarkdownEditor");
}

function MarkdownEditorLoadingFallback() {
  const state = useContext(LoadingEditorContext);
  if (!state) return null;
  const height = state.compact
    ? (state.withAttachments ? css.editorLoadingCompactWithFooter : css.editorLoadingCompact)
    : css.editorLoadingRegular;
  return <div className={`${css.editorLoading} ${height}`}>
    <textarea
      className={css.editorLoadingInput}
      aria-label={state.label}
      value={state.value}
      autoFocus={state.autoFocus}
      placeholder={state.locale === "ru" ? "Введите текст…" : "Enter text…"}
      spellCheck
      onChange={(event) => state.onChange(event.target.value)}
    />
  </div>;
}

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
  useEffect(() => {
    void loadMarkdownEditor();
  }, []);
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
    <LoadingEditorContext.Provider value={{
      value: props.value,
      label: props.label,
      locale,
      compact: Boolean(props.compact),
      withAttachments: Boolean(addFiles),
      autoFocus: Boolean(props.autoFocus),
      onChange: props.onChange,
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
    </LoadingEditorContext.Provider>
    {attachmentEnabled && attachmentProblem && <span className={css.attachmentError} role="alert">
      {attachmentProblem}
    </span>}
  </div>;
}
