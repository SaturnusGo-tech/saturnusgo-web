"use client";

import {
  ButtonOrDropdownButton, ButtonWithTooltip, InsertImage, Select,
  IS_BOLD, Separator, UndoRedo, applyFormat$, applyListType$, convertSelectionToNode$, currentBlockType$, currentFormat$, currentListType$,
  useCellValue, usePublisher, readOnly$,
} from "@mdxeditor/editor";
import { Bold, Ellipsis, List, SquareCheck } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { HighlightToolbar } from "../../../../presentation/cases/inspector/markdown/highlight/toolbar/HighlightToolbar";
import styles from "../editor.module.css";
import { ProductDocFormattingTools, productDocTextStyles } from "../formatting/ProductDocFormattingTools";
import { ProductDocEmoji } from "../emoji/ProductDocEmoji";
import { ProductDocTableTools } from "../tables/ProductDocTableTools";
import { ProductDocInsertMenu } from "./ProductDocInsertMenu";
import { ProductDocLayoutTools } from "../layouts/toolbar/ProductDocLayoutTools";
import { ProductDocLinkTrigger } from "../links/ProductDocLinkDialog";

export function ProductDocToolbar({ locale, onImport }: {
  locale: TmsLocale;
  onImport(): void;
}) {
  const ru = locale === "ru";
  const format = usePublisher(applyFormat$);
  const list = usePublisher(applyListType$);
  const formatFlags = useCellValue(currentFormat$);
  const listType = useCellValue(currentListType$);
  const blockType = useCellValue(currentBlockType$);
  const convertBlock = usePublisher(convertSelectionToNode$);
  const readOnly = useCellValue(readOnly$);
  const blockTypes = productDocTextStyles(locale);

  return <>
    <div className={styles.textStyle}>
      <Select value={blockTypes.some((item) => item.value === blockType) ? blockType : ""}
        triggerTitle={ru ? "Стиль текста" : "Text style"} placeholder={blockTypes[0].label}
        items={blockTypes} onChange={(value) => {
          const choice = blockTypes.find((item) => item.value === value);
          if (choice) convertBlock(choice.create);
        }} />
    </div>
    <Separator />
    <div className={styles.toolbarGroup}>
      <ButtonWithTooltip title={ru ? "Жирный" : "Bold"} aria-pressed={Boolean(formatFlags & IS_BOLD)}
        disabled={readOnly} onClick={() => format("bold")}><Bold size={16} /></ButtonWithTooltip>
      <ButtonOrDropdownButton title={ru ? "Форматирование" : "Formatting"} onChoose={format} items={[
        { value: "italic", label: ru ? "Курсив" : "Italic" },
        { value: "underline", label: ru ? "Подчёркнутый" : "Underline" },
        { value: "strikethrough", label: ru ? "Зачёркнутый" : "Strikethrough" },
        { value: "code", label: ru ? "Код в строке" : "Inline code" },
      ]}><Ellipsis size={16} /></ButtonOrDropdownButton>
    </div>
    <div className={styles.toolbarGroup}>
      <ButtonOrDropdownButton title={ru ? "Списки" : "Lists"} onChoose={list} items={[
        { value: "bullet", label: ru ? "Маркированный список" : "Bulleted list" },
        { value: "number", label: ru ? "Нумерованный список" : "Numbered list" },
        { value: "check", label: ru ? "Чек-лист" : "Task list" },
      ]}><List size={16} /></ButtonOrDropdownButton>
    </div>
    <ProductDocFormattingTools locale={locale} />
    {!readOnly && <HighlightToolbar locale={locale} />}
    <Separator />
    <div className={styles.toolbarGroup}>
      <ButtonWithTooltip title={ru ? "Чек-лист" : "Task list"} aria-pressed={listType === "check"}
        disabled={readOnly} onClick={() => list(listType === "check" ? "" : "check")}><SquareCheck size={16} /></ButtonWithTooltip>
      <InsertImage />
      <ProductDocEmoji locale={locale} />
      <ProductDocLayoutTools locale={locale} />
      <ProductDocTableTools locale={locale} />
      <ProductDocInsertMenu locale={locale} onImport={onImport} />
    </div>
    <Separator />
    <ProductDocLinkTrigger locale={locale} />
    <Separator />
    <UndoRedo />
  </>;
}
