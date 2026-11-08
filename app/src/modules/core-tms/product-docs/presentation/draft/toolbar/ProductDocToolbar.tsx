"use client";

import {
  IS_BOLD, Separator, applyFormat$, applyListType$, convertSelectionToNode$, currentBlockType$, currentFormat$, currentListType$,
  editorInTable$, insertDirective$, useCellValue, usePublisher, readOnly$,
} from "@mdxeditor/editor";
import { Bold, CircleDot, Ellipsis, List, Paperclip, SquareCheck } from "lucide-react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { productDocOpenAttachmentPicker$ } from "../media/input/ProductDocImageInput";
import { ProductDocBodyHighlight } from "../highlight/ProductDocBodyHighlight";
import styles from "../editor.module.css";
import { productDocRadioName } from "../blocks/radio/radioOptions";
import { ProductDocFormattingTools, productDocTextStyles } from "../formatting/ProductDocFormattingTools";
import { ProductDocEmoji } from "../emoji/ProductDocEmoji";
import { ProductDocTableTools } from "../tables/ProductDocTableTools";
import { ProductDocToolbarButton, ProductDocToolbarMenu } from "./menu/ProductDocToolbarMenu";
import { ProductDocInsertMenu } from "./ProductDocInsertMenu";
import { ProductDocHistoryControls } from "./history/ProductDocHistoryControls";

import { ProductDocLayoutTools } from "../layouts/toolbar/ProductDocLayoutTools";
import { ProductDocLinkTrigger } from "../links/ProductDocLinkDialog";

export function ProductDocToolbar({ locale, onImport }: {
  locale: TmsLocale;
  onImport(): void;
}) {
  const ru = locale === "ru";
  const format = usePublisher(applyFormat$);
  const directive = usePublisher(insertDirective$);
  const openAttachment = usePublisher(productDocOpenAttachmentPicker$);
  const list = usePublisher(applyListType$);
  const formatFlags = useCellValue(currentFormat$);
  const listType = useCellValue(currentListType$);
  const blockType = useCellValue(currentBlockType$);
  const convertBlock = usePublisher(convertSelectionToNode$);
  const readOnly = useCellValue(readOnly$);
  const inTable = useCellValue(editorInTable$);
  const blockTypes = productDocTextStyles(locale);

  return <>
    <div className={styles.textStyle}>
      <ProductDocToolbarMenu title={ru ? "Стиль текста" : "Text style"} selected={blockType}
        items={blockTypes} disabled={readOnly} onChoose={(value) => {
          const choice = blockTypes.find((item) => item.value === value);
          if (choice) convertBlock(choice.create);
        }}>
        {blockTypes.find((item) => item.value === blockType)?.label ?? blockTypes[0].label}
      </ProductDocToolbarMenu>
    </div>
    <Separator />
    <div className={styles.toolbarGroup}>
      <ProductDocToolbarButton label={ru ? "Жирный" : "Bold"} isIconOnly aria-pressed={Boolean(formatFlags & IS_BOLD)}
        isDisabled={readOnly} onMouseDown={(event) => event.preventDefault()} onPress={() => format("bold")}><Bold size={16} /></ProductDocToolbarButton>
      <ProductDocToolbarMenu disabled={readOnly} title={ru ? "Форматирование" : "Formatting"} onChoose={format} items={[
        { value: "italic", label: ru ? "Курсив" : "Italic" },
        { value: "underline", label: ru ? "Подчёркнутый" : "Underline" },
        { value: "strikethrough", label: ru ? "Зачёркнутый" : "Strikethrough" },
        { value: "code", label: ru ? "Код в строке" : "Inline code" },
      ]}><Ellipsis size={16} /></ProductDocToolbarMenu>
    </div>
    <div className={styles.toolbarGroup}>
      <ProductDocToolbarMenu disabled={readOnly} title={ru ? "Списки" : "Lists"} selected={listType} onChoose={list} items={[
        { value: "bullet", label: ru ? "Маркированный список" : "Bulleted list" },
        { value: "number", label: ru ? "Нумерованный список" : "Numbered list" },
        { value: "check", label: ru ? "Чек-лист" : "Task list" },
      ]}><List size={16} /></ProductDocToolbarMenu>
    </div>
    <ProductDocFormattingTools locale={locale} />
    {!readOnly && <ProductDocBodyHighlight locale={locale} />}
    <Separator />
    <div className={styles.toolbarGroup}>
      <ProductDocToolbarButton label={ru ? "Чек-лист" : "Task list"} isIconOnly aria-pressed={listType === "check"}
        isDisabled={readOnly} onMouseDown={(event) => event.preventDefault()} onPress={() => list(listType === "check" ? "" : "check")}><SquareCheck size={16} /></ProductDocToolbarButton>
      <ProductDocToolbarButton label={ru ? "Один вариант" : "Radio options"} isIconOnly isDisabled={readOnly || inTable}
        onMouseDown={(event) => event.preventDefault()} onPress={() => directive({ type: "containerDirective", name: productDocRadioName })}>
        <CircleDot size={16} /></ProductDocToolbarButton>
      <ProductDocToolbarButton label={ru ? "Прикрепить файл" : "Attach file"} isIconOnly isDisabled={readOnly || inTable}
        onMouseDown={(event) => event.preventDefault()} onPress={() => openAttachment()}><Paperclip size={16} /></ProductDocToolbarButton>
      <ProductDocEmoji locale={locale} />
      <ProductDocLayoutTools locale={locale} />
      <ProductDocTableTools locale={locale} />
      <ProductDocInsertMenu locale={locale} onImport={onImport} />
    </div>
    <Separator />
    <ProductDocLinkTrigger locale={locale} />
    <Separator />
    <ProductDocHistoryControls ru={ru} />
  </>;
}
