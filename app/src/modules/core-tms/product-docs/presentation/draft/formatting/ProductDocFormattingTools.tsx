"use client";

import { activeEditor$, currentSelection$, readOnly$, useCellValue } from "@mdxeditor/editor";
import { $patchStyleText } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createParagraphNode, $getSelection, $isParagraphNode, $isRangeSelection, $isRootOrShadowRoot, $setSelection,
  type ElementNode, type RangeSelection } from "lexical";
import { AlignLeft, Baseline } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { productDocToneColor, type ProductDocTone } from "./productDocFormatting";
import styles from "../editor.module.css";
import { ProductDocToolbarMenu } from "../toolbar/menu/ProductDocToolbarMenu";

export function productDocTextStyles(locale: TmsLocale): { value: string; label: string; create(): ElementNode }[] {
  const ru = locale === "ru";
  return [
    { value: "paragraph", label: ru ? "Обычный текст" : "Normal text", create: $createParagraphNode },
    ...([1, 2, 3, 4] as const).map((level) => ({
      value: `h${level}`, label: `H${level} · ${ru ? "Заголовок" : "Heading"} ${level}`,
      create: () => $createHeadingNode(`h${level}`),
    })),
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
  const ru = locale === "ru";

  function apply(change: (selection: RangeSelection) => void) {
    if (!editor || readOnly) return;
    editor.update(() => {
      const selection = $getSelection() ?? currentSelection;
      if (!$isRangeSelection(selection)) return;
      if ($getSelection() !== selection) $setSelection(selection.clone());
      const active = $getSelection();
      if ($isRangeSelection(active)) change(active);
    });
  }

  if (readOnly) return null;
  return <div className={styles.toolbarGroup}>
    <ProductDocToolbarMenu title={ru ? "Выравнивание абзаца" : "Paragraph alignment"}
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
      ]}><AlignLeft size={16} /></ProductDocToolbarMenu>
    <ProductDocToolbarMenu title={ru ? "Цвет текста" : "Text color"}
      onChoose={(value) => apply((selection) => {
        $patchStyleText(selection, { color: value === "default" ? null : productDocToneColor(value) });
      })}
      items={productDocTextColors(locale).map(({ value, label }) => ({
        value, label, content: <span className={styles.colorChoice}>
          <span className={styles.colorSwatch} aria-hidden="true"
            style={{ color: value === "default" ? "var(--falcon-text)" : productDocToneColor(value) }} />
          {label}
        </span>,
      }))}><Baseline size={16} /></ProductDocToolbarMenu>
  </div>;
}
