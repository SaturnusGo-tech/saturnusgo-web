"use client";

import { activeEditor$, ButtonOrDropdownButton, currentSelection$, readOnly$, useCellValue } from "@mdxeditor/editor";
import { $patchStyleText } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createParagraphNode, $getSelection, $isParagraphNode, $isRangeSelection, $isRootOrShadowRoot, $setSelection,
  type ElementNode, type RangeSelection } from "lexical";
import { AlignLeft, Baseline } from "lucide-react";
import { useRef } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { productDocToneColor, type ProductDocTone } from "./productDocFormatting";
import styles from "../editor.module.css";

export function productDocTextStyles(locale: TmsLocale): { value: string; label: string; create(): ElementNode }[] {
  const ru = locale === "ru";
  return [
    { value: "paragraph", label: ru ? "Обычный текст" : "Normal text", create: $createParagraphNode },
    { value: "h2", label: ru ? "Заголовок 2" : "Heading 2", create: () => $createHeadingNode("h2") },
    { value: "h3", label: ru ? "Заголовок 3" : "Heading 3", create: () => $createHeadingNode("h3") },
    { value: "h4", label: ru ? "Заголовок 4" : "Heading 4", create: () => $createHeadingNode("h4") },
    { value: "quote", label: ru ? "Цитата" : "Quote", create: $createQuoteNode },
  ];
}

export function productDocTextColors(locale: TmsLocale): { value: ProductDocTone | "default"; label: string }[] {
  const ru = locale === "ru";
  return [
    { value: "default", label: ru ? "По умолчанию" : "Default" },
    { value: "muted", label: ru ? "Приглушённый" : "Muted" },
    { value: "info", label: ru ? "Синий" : "Blue" },
    { value: "success", label: ru ? "Зелёный" : "Green" },
    { value: "warning", label: ru ? "Оранжевый" : "Orange" },
    { value: "danger", label: ru ? "Красный" : "Red" },
  ];
}

export function ProductDocFormattingTools({ locale }: { locale: TmsLocale }) {
  const editor = useCellValue(activeEditor$);
  const currentSelection = useCellValue(currentSelection$);
  const readOnly = useCellValue(readOnly$);
  const saved = useRef<RangeSelection | null>(null);
  const ru = locale === "ru";

  function rememberSelection() {
    saved.current = editor?.getEditorState().read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? selection.clone() : currentSelection?.clone() ?? null;
    }) ?? null;
  }

  function apply(change: (selection: RangeSelection) => void) {
    if (!editor || readOnly) return;
    const selected = saved.current ?? currentSelection;
    saved.current = null;
    if (!selected) return;
    editor.update(() => {
      const selection = selected.clone();
      $setSelection(selection);
      change(selection);
    });
    editor.focus();
  }

  if (readOnly) return null;
  return <div className={styles.toolbarGroup} onPointerDownCapture={rememberSelection}
    onKeyDownCapture={(event) => {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") rememberSelection();
    }}>
    <ButtonOrDropdownButton title={ru ? "Выравнивание абзаца" : "Paragraph alignment"}
      onChoose={(mode) => apply((selection) => {
        for (const node of selection.getNodes()) {
          const block = node.getTopLevelElement();
          if ($isParagraphNode(block) && $isRootOrShadowRoot(block.getParent())) block.setFormat(mode);
        }
      })}
      items={[
        { value: "left", label: ru ? "По левому краю" : "Align left" },
        { value: "center", label: ru ? "По центру" : "Align center" },
        { value: "right", label: ru ? "По правому краю" : "Align right" },
      ]}><AlignLeft size={16} /></ButtonOrDropdownButton>
    <ButtonOrDropdownButton title={ru ? "Цвет текста" : "Text color"}
      onChoose={(value) => apply((selection) => {
        $patchStyleText(selection, { color: value === "default" ? null : productDocToneColor(value) });
      })}
      items={productDocTextColors(locale).map(({ value, label }) => ({
        value, label: <span className={styles.colorChoice}>
          <span className={styles.colorSwatch} aria-hidden="true"
            style={{ color: value === "default" ? "var(--falcon-text)" : productDocToneColor(value) }} />
          {label}
        </span>,
      }))}><Baseline size={16} /></ButtonOrDropdownButton>
  </div>;
}
