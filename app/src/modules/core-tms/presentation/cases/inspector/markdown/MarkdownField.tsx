"use client";

import { ErrorToast } from "../../../common/error/ErrorToast";
import MDEditor from "@uiw/react-md-editor/nohighlight";
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { MarkdownContextContent } from "./context/MarkdownContextContent";
import { useColorMode } from "../../../../../../shared/_hooks/useColorMode";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useCaseAttachmentDraft } from "../attachments/CaseAttachmentDraftContext";
import { fileTransferHandlers } from "../attachments/input/fileTransfer";
import { MarkdownPendingAttachments } from "./attachments/MarkdownAttachmentUi";
import css from "./markdownField.module.css";
import plain from "./plain/plainMarkdown.module.css";
import { MarkdownTransition, MarkdownReadyContext } from "./transition/MarkdownTransition";
import { highlightRemarkPlugins } from "./highlight/render/remarkHighlights";
import typography from "./typography/markdownTypography.module.css";
import markerCss from "./highlight/highlight.module.css";
import { ProductDocDescriptionLink } from "../../../../product-docs/requirements/description/ProductDocDescriptionLink";
import { CaseReferenceLink } from "../../../../case-references/presentation/CaseReferenceLink";
import { remarkCaseReferences } from "../../../../case-references/markdown/remarkCaseReferences";

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
  onTransferFiles?: (files: File[]) => void;
  contextContent?: ReactNode;
  appearance?: "plain";
  onRequestEdit?: () => void;
  editOnKeyboard?: boolean;
  renderFooter?: (emoji: ReactNode) => ReactNode;
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
const caseRemarkPlugins = [...highlightRemarkPlugins, remarkCaseReferences];
const caseDocumentationComponents = {a: (props: Parameters<typeof CaseReferenceLink>[0]) => <CaseReferenceLink {...props}
  fallback={<ProductDocDescriptionLink {...props} />} />};
const caseReferenceComponents = {a: CaseReferenceLink};

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
  const productDocLinks = props.attachmentKey === "description"
    || props.attachmentKey === "preconditions" || props.attachmentKey === "test-data";
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
    role={props.editOnKeyboard && props.onRequestEdit ? "button" : undefined}
    tabIndex={props.editOnKeyboard && props.onRequestEdit ? 0 : undefined}
    aria-label={props.editOnKeyboard && props.onRequestEdit ? `${locale === "ru" ? "Изменить" : "Edit"}: ${props.label}` : undefined}
    onKeyDown={props.editOnKeyboard && props.onRequestEdit ? (event) => {
      if (event.defaultPrevented || event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      props.onRequestEdit?.();
    } : undefined}
    onClick={props.onRequestEdit ? (event) => {
      if ((event.target as Element).closest("a, button, input") || window.getSelection()?.toString()) return;
      props.onRequestEdit?.();
    } : undefined}>
    {!props.value.trim() ? <p className={css.empty}>{props.emptyLabel}</p> : <MDEditor.Markdown
      className={`${css.rendered} ${markerCss.surface} ${typography.prose}`} source={props.value} skipHtml remarkPlugins={caseRemarkPlugins}
      components={productDocLinks ? caseDocumentationComponents : caseReferenceComponents}
      urlTransform={(url) => isSafeUrl(url) ? url : ""}
      wrapperElement={{ "data-color-mode": colorMode }} />}
    {attachments && <MarkdownPendingAttachments locale={locale} entries={pending} onRemove={attachments.remove} />}
  </div>;
  const addFiles = attachmentEnabled ? addAttachmentFiles : undefined;
  const transfer = fileTransferHandlers(props.onTransferFiles ?? addFiles);
  const draftProblem = attachments?.problem;
  let attachmentProblem = "";
  if (draftProblem && draftProblem.fieldKey === props.attachmentKey) {
    attachmentProblem = draftProblem.message;
  }
  return <div className={`${css.field} ${props.appearance === "plain" ? plain.plain : ""}`} data-editor-shell data-appearance={props.appearance} data-color-mode={colorMode} role="group" aria-label={props.label}
    onPasteCapture={transfer.onPaste} onDragOver={transfer.onDragOver} onDropCapture={transfer.onDrop}>
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
        productDocLinks={productDocLinks}
        suppressEmailLinkPreview={props.attachmentKey === "test-data"}
        renderFooter={props.renderFooter}
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
    <ErrorToast message={attachmentEnabled ? attachmentProblem : null} />
  </div>;
}
