"use client";

import {
  BlockTypeSelect, BoldItalicUnderlineToggles, CodeToggle, CreateLink,
  InsertCodeBlock, InsertTable, InsertThematicBreak, ListsToggle, MDXEditor,
  Separator, StrikeThroughSupSubToggles, UndoRedo,
  codeBlockPlugin, headingsPlugin, linkDialogPlugin, linkPlugin, listsPlugin,
  markdownShortcutPlugin, quotePlugin, tablePlugin, thematicBreakPlugin, toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useMemo } from "react";
import { MarkdownCodeEditor } from "../../../presentation/cases/inspector/markdown/code/MarkdownCodeEditor";
import { markdownEditorTranslation } from "../../../presentation/cases/inspector/markdown/translations/markdownEditorTranslation";
import type { TmsLocale } from "../../../localization/model/locale";
import styles from "../product-docs.module.css";

export default function RichProductSection({ markdown, label, locale, disabled, onChange, onValidity }: {
  markdown: string;
  label: string;
  locale: TmsLocale;
  disabled: boolean;
  onChange(value: string): void;
  onValidity(valid: boolean): void;
}) {
  const plugins = useMemo(() => [
    headingsPlugin({ allowedHeadingLevels: [3, 4, 5] }),
    listsPlugin(),
    quotePlugin(),
    tablePlugin(),
    thematicBreakPlugin(),
    codeBlockPlugin({ codeBlockEditorDescriptors: [{ priority: 0, match: () => true, Editor: MarkdownCodeEditor }] }),
    linkPlugin({ validateUrl: (url) => /^(?:https?:\/\/|mailto:|#|\/(?!\/))/i.test(url.trim()) }),
    linkDialogPlugin(),
    markdownShortcutPlugin(),
    toolbarPlugin({
      toolbarContents: () => <>
        <UndoRedo /><Separator /><BlockTypeSelect /><Separator />
        <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
        <StrikeThroughSupSubToggles options={["Strikethrough"]} /><CodeToggle />
        <Separator /><ListsToggle /><CreateLink /><InsertTable /><InsertCodeBlock /><InsertThematicBreak />
      </>,
    }),
  ], []);

  return <MDXEditor markdown={markdown} plugins={plugins}
    readOnly={disabled}
    className={styles.editor}
    contentEditableClassName={styles.editorBody}
    placeholder={label}
    suppressHtmlProcessing
    spellCheck
    translation={(key, fallback, vars) => key === "contentArea.editableMarkdown"
      ? label : markdownEditorTranslation(locale, key, fallback, vars)}
    onError={() => onValidity(false)}
    onChange={(value, initialNormalize) => {
      if (!initialNormalize) { onValidity(true); onChange(value); }
    }} />;
}
