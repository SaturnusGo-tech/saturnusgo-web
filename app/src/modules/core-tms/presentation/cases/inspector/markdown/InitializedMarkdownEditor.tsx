"use client";

import {
  MDXEditor,
  headingsPlugin,
  codeBlockPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  realmPlugin,
  addTopAreaChild$,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PendingCaseAttachment } from "../../../../application/evidence/case/pendingCaseAttachment";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MarkdownAttachmentButton, MarkdownPendingAttachments } from "./attachments/MarkdownAttachmentUi";
import { markdownEditorTranslation } from "./translations/markdownEditorTranslation";
import css from "./markdownField.module.css";
import { MarkdownCodeEditor } from "./code/MarkdownCodeEditor";
import { stripRawHtml } from "./code/stripRawHtml";
import { MarkdownContextArea } from "./context/MarkdownContextContent";
import { MarkdownReadyContext } from "./transition/MarkdownTransition";
import { MarkdownToolbar } from "./writing/MarkdownToolbar";
import { highlightPlugin } from "./highlight/editor/highlightPlugin";
import markerCss from "./highlight/highlight.module.css";

const contextContentPlugin = realmPlugin({
  init(realm) { realm.pub(addTopAreaChild$, MarkdownContextArea); },
});

export type InitializedMarkdownEditorProps = {
  markdown: string;
  label: string;
  locale: TmsLocale;
  compact?: boolean;
  autoFocus?: boolean;
  validateUrl: (url: string) => boolean;
  onChange: (markdown: string) => void;
  pendingAttachments?: PendingCaseAttachment[];
  onAttachmentFiles?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
};

export default function InitializedMarkdownEditor(props: InitializedMarkdownEditorProps) {
  const onReady = useContext(MarkdownReadyContext);
  const editorRef = useRef<MDXEditorMethods>(null);
  const overlayAnchor = useRef<HTMLDivElement>(null);
  const [overlayContainer, setOverlayContainer] = useState<HTMLElement | null>(null);
  const [editorPainted, setEditorPainted] = useState(false);
  const initialMarkdown = stripRawHtml(props.markdown);
  const lastEmitted = useRef(initialMarkdown);
  const [problem, setProblem] = useState("");
  const plugins = useMemo(() => [
    headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
    codeBlockPlugin({ codeBlockEditorDescriptors: [{ priority: 0, match: () => true, Editor: MarkdownCodeEditor }] }),
    listsPlugin(),
    quotePlugin(),
    tablePlugin(),
    thematicBreakPlugin(),
    highlightPlugin(),
    linkPlugin({ validateUrl: props.validateUrl }),
    linkDialogPlugin({
      onClickLinkCallback: (url) => {
        if (!props.validateUrl(url)) return;
        window.open(url, "_blank", "noopener,noreferrer");
      },
    }),
    markdownShortcutPlugin(),
    toolbarPlugin({
      toolbarContents: () => <MarkdownToolbar locale={props.locale} />,
    }),
    contextContentPlugin(),
  ], [props.locale, props.onAttachmentFiles, props.validateUrl]);

  useEffect(() => {
    const safe = stripRawHtml(props.markdown);
    if (safe !== props.markdown) props.onChange(safe);
  }, [props.markdown, props.onChange]);

  useEffect(() => {
    setOverlayContainer(overlayAnchor.current?.closest<HTMLElement>(
      "[data-case-inspector-overlay-root]",
    ) ?? document.body);
  }, []);

  useEffect(() => {
    const next = stripRawHtml(props.markdown);
    if (!editorRef.current || next === lastEmitted.current) return;
    lastEmitted.current = next;
    editorRef.current.setMarkdown(next);
  }, [props.markdown]);

  useEffect(() => {
    if (editorPainted) return;
    let animationFrame = 0;
    let matchingFrames = 0;
    const expected = stripRawHtml(props.markdown).trim();
    const waitForPaint = () => {
      const editor = editorRef.current;
      const rendered = stripRawHtml(editor?.getMarkdown() ?? "").trim();
      const hasRenderedContent = Boolean(editor) && (rendered === expected || rendered === lastEmitted.current.trim());
      matchingFrames = hasRenderedContent ? matchingFrames + 1 : 0;
      if (matchingFrames >= 2) {
        setEditorPainted(true);
        return;
      }
      animationFrame = window.requestAnimationFrame(waitForPaint);
    };
    animationFrame = window.requestAnimationFrame(waitForPaint);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [editorPainted, props.markdown]);

  useEffect(() => {
    if (editorPainted || problem) onReady?.();
  }, [editorPainted, problem, onReady]);

  useEffect(() => {
    if (!editorPainted || !props.autoFocus || onReady) return;
    editorRef.current?.focus(undefined, { defaultSelection: "rootStart", preventScroll: true });
  }, [editorPainted, props.autoFocus, onReady]);

  const loadingHeight = props.compact
    ? (props.onAttachmentFiles ? css.editorLoadingCompactWithFooter : css.editorLoadingCompact)
    : css.editorLoadingRegular;

  return <>
    <div ref={overlayAnchor} className={css.editorOverlayHost} />
    <MDXEditor
      ref={editorRef}
      overlayContainer={overlayContainer ?? undefined}
      markdown={initialMarkdown}
      className={`${css.wysiwyg} ${markerCss.surface} ${props.compact ? css.compact : ""}`}
      contentEditableClassName={css.editorContent}
      autoFocus={props.autoFocus && !onReady ? { defaultSelection: "rootStart", preventScroll: true } : false}
      placeholder={props.locale === "ru" ? "Введите текст…" : "Enter text…"}
      suppressHtmlProcessing
      spellCheck
      plugins={plugins}
      translation={(key, fallback, interpolations) => key === "contentArea.editableMarkdown"
        ? props.label
        : markdownEditorTranslation(props.locale, key, fallback, interpolations)}
      onError={() => setProblem(props.locale === "ru"
        ? "Часть форматирования не поддерживается. Удалите HTML-разметку."
        : "Some formatting is unsupported. Remove raw HTML markup.")}
      onChange={(markdown, initialNormalize) => {
        const next = stripRawHtml(markdown);
        lastEmitted.current = next;
        setProblem("");
        if (!initialNormalize) props.onChange(next);
      }}
    />
    {props.onRemoveAttachment && <MarkdownPendingAttachments
      locale={props.locale}
      entries={props.pendingAttachments ?? []}
      onRemove={props.onRemoveAttachment}
    />}
    {props.onAttachmentFiles && <div className={css.editorFooter}>
      <MarkdownAttachmentButton locale={props.locale} onFiles={props.onAttachmentFiles} />
    </div>}
    {!editorPainted && !onReady && <div className={`${css.editorLoading} ${css.editorBootOverlay} ${loadingHeight}`}>
      <textarea
        className={css.editorLoadingInput}
        aria-label={props.label}
        value={props.markdown}
        autoFocus={props.autoFocus}
        placeholder={props.locale === "ru" ? "Введите текст…" : "Enter text…"}
        spellCheck
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>}
    {problem && <span className={css.editorError} role="alert">{problem}</span>}
  </>;
}
