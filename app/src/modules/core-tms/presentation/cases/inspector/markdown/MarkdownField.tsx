"use client";

import MDEditor from "@uiw/react-md-editor/nohighlight";
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { MarkdownContextContent } from "./context/MarkdownContextContent";
import { useColorMode } from "../../../../../../shared/_hooks/useColorMode";
import { filesFromClipboard } from "../../../../application/evidence/case/pendingCaseAttachment";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useCaseAttachmentDraft } from "../attachments/CaseAttachmentDraftContext";
import { MarkdownPendingAttachments } from "./attachments/MarkdownAttachmentUi";
import css from "./markdownField.module.css";
import plain from "./plain/plainMarkdown.module.css";
import { MarkdownTransition, MarkdownReadyContext } from "./transition/MarkdownTransition";
import { highlightRemarkPlugins } from "./highlight/render/remarkHighlights";
import typography from "./typography/markdownTypography.module.css";
import markerCss from "./highlight/highlight.module.css";

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
  contextContent?: ReactNode;
  appearance?: "plain";
  onRequestEdit?: () => void;
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
  const onReady = useContext(MarkdownReadyContext);
  if (onReady) return null;
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
  if (props.appearance === "plain") return <MarkdownTransition editing={Boolean(props.onChange)} autoFocus={props.autoFocus}
    read={<MarkdownFieldContent {...props} onChange={undefined} />}
    editor={props.onChange ? <MarkdownFieldContent {...props} /> : null} />;
  return <MarkdownFieldContent {...props} />;
}

function MarkdownFieldContent(props: Props) {
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
  const pending = attachmentEnabled
    ? attachments?.entries.filter((entry) => entry.fieldKey === props.attachmentKey) ?? []
    : [];
  if (!props.onChange) return <div className={props.onRequestEdit ? plain.readable : undefined}
    onClick={props.onRequestEdit ? (event) => {
      if ((event.target as Element).closest("a, button, input") || window.getSelection()?.toString()) return;
      props.onRequestEdit?.();
    } : undefined}>
    {!props.value.trim() ? <p className={css.empty}>{props.emptyLabel}</p> : <MDEditor.Markdown
      className={`${css.rendered} ${markerCss.surface} ${typography.prose}`} source={props.value} skipHtml remarkPlugins={highlightRemarkPlugins}
      urlTransform={(url) => isSafeUrl(url) ? url : ""}
      wrapperElement={{ "data-color-mode": colorMode }} />}
    {attachments && <MarkdownPendingAttachments locale={locale} entries={pending} onRemove={attachments.remove} />}
  </div>;
  const addFiles = attachmentEnabled ? addAttachmentFiles : undefined;
  const draftProblem = attachments?.problem;
  let attachmentProblem = "";
  if (draftProblem && draftProblem.fieldKey === props.attachmentKey) {
    attachmentProblem = draftProblem.message;
  }
  return <div className={`${css.field} ${props.appearance === "plain" ? plain.plain : ""}`} data-editor-shell data-appearance={props.appearance} data-color-mode={colorMode} role="group" aria-label={props.label}
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
      <MarkdownContextContent.Provider value={props.contextContent}>
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
      </MarkdownContextContent.Provider>
    </LoadingEditorContext.Provider>
    {attachmentEnabled && attachmentProblem && <span className={css.attachmentError} role="alert">
      {attachmentProblem}
    </span>}
  </div>;
}
