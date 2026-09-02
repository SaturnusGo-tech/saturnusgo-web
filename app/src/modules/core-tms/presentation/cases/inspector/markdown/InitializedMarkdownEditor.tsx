"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  ListsToggle,
  MDXEditor,
  Separator,
  StrikeThroughSupSubToggles,
  UndoRedo,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PendingCaseAttachment } from "../../../../application/evidence/case/pendingCaseAttachment";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MarkdownAttachmentButton, MarkdownPendingAttachments } from "./attachments/MarkdownAttachmentUi";
import css from "./markdownField.module.css";

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

export function stripRawHtml(markdown: string) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*?)?\s*\/?>/g, "")
    .replace(/<(?:!DOCTYPE|\?xml)[^>]*>/gi, "");
}

const RU_TRANSLATIONS: Record<string, string> = {
  "toolbar.bold": "Жирный",
  "toolbar.removeBold": "Убрать жирный",
  "toolbar.italic": "Курсив",
  "toolbar.removeItalic": "Убрать курсив",
  "toolbar.strikethrough": "Зачёркнутый",
  "toolbar.removeStrikethrough": "Убрать зачёркивание",
  "toolbar.code": "Код",
  "toolbar.removeCode": "Убрать код",
  "toolbar.inlineCode": "Код",
  "toolbar.removeInlineCode": "Убрать код",
  "toolbar.undo": "Отменить",
  "toolbar.redo": "Повторить",
  "toolbar.blockTypes.paragraph": "Абзац",
  "toolbar.blockTypes.quote": "Цитата",
  "toolbar.blockTypes.heading": "Заголовок {{level}}",
  "toolbar.blockTypeSelect.selectBlockTypeTooltip": "Тип блока",
  "toolbar.blockTypeSelect.placeholder": "Тип блока",
  "toolbar.bulletedList": "Маркированный список",
  "toolbar.numberedList": "Нумерованный список",
  "toolbar.checkList": "Чек-лист",
  "toolbar.toggleGroup": "Списки",
  "toolbar.link": "Добавить ссылку",
};

function editorTranslation(
  locale: TmsLocale,
  key: string,
  fallback: string,
  interpolations: Record<string, unknown> = {},
) {
  const template = locale === "ru" ? (RU_TRANSLATIONS[key] ?? fallback) : fallback;
  return Object.entries(interpolations).reduce(
    (value, [name, replacement]) => value.replaceAll(`{{${name}}}`, String(replacement)),
    template,
  );
}

export default function InitializedMarkdownEditor(props: InitializedMarkdownEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const initialMarkdown = stripRawHtml(props.markdown);
  const lastEmitted = useRef(initialMarkdown);
  const [problem, setProblem] = useState("");
  const plugins = useMemo(() => [
    headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
    listsPlugin(),
    quotePlugin(),
    tablePlugin(),
    thematicBreakPlugin(),
    linkPlugin({ validateUrl: props.validateUrl }),
    linkDialogPlugin({
      onClickLinkCallback: (url) => {
        if (!props.validateUrl(url)) return;
        window.open(url, "_blank", "noopener,noreferrer");
      },
    }),
    markdownShortcutPlugin(),
    toolbarPlugin({
      toolbarContents: () => <>
        <UndoRedo /><Separator />
        <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
        <StrikeThroughSupSubToggles options={["Strikethrough"]} />
        <CodeToggle /><Separator />
        <BlockTypeSelect /><ListsToggle /><CreateLink />
        {props.onAttachmentFiles && <MarkdownAttachmentButton
          locale={props.locale} onFiles={props.onAttachmentFiles}
        />}
      </>,
    }),
  ], [props.locale, props.onAttachmentFiles, props.validateUrl]);

  useEffect(() => {
    const safe = stripRawHtml(props.markdown);
    if (safe !== props.markdown) props.onChange(safe);
  }, [props.markdown, props.onChange]);

  useEffect(() => {
    const next = stripRawHtml(props.markdown);
    if (!editorRef.current || next === lastEmitted.current) return;
    lastEmitted.current = next;
    editorRef.current.setMarkdown(next);
  }, [props.markdown]);

  return <>
    <MDXEditor
      ref={editorRef}
      markdown={initialMarkdown}
      className={`${css.wysiwyg} ${props.compact ? css.compact : ""}`}
      contentEditableClassName={css.editorContent}
      autoFocus={props.autoFocus ? { defaultSelection: "rootStart", preventScroll: true } : false}
      placeholder={props.locale === "ru" ? "Введите текст…" : "Enter text…"}
      suppressHtmlProcessing
      spellCheck
      plugins={plugins}
      translation={(key, fallback, interpolations) => key === "contentArea.editableMarkdown"
        ? props.label
        : editorTranslation(props.locale, key, fallback, interpolations)}
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
    {problem && <span className={css.editorError} role="alert">{problem}</span>}
  </>;
}
