"use client";

import {
  activeEditor$, addComposerChild$, editorRootElementRef$, readOnly$, realmPlugin, useCellValue,
} from "@mdxeditor/editor";
import { $copyBlockFormatIndent, $patchStyleText, $setBlocksType } from "@lexical/selection";
import {
  $getNodeByKey, $getSelection, $getState, $isElementNode, $isRangeSelection, $isTextNode,
  $setSelection, $setState, SKIP_SCROLL_INTO_VIEW_TAG,
  type PointType, type RangeSelection, type TextFormatType,
} from "lexical";
import { $isHeadingNode } from "@lexical/rich-text";
import { Baseline, Bold, ChevronDown, Italic, Strikethrough, Type, Underline } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { RawHighlightToolbar } from "../../../../presentation/cases/inspector/markdown/highlight/raw/RawHighlightToolbar";
import { highlightStyleProperty } from "../../../../presentation/cases/inspector/markdown/highlight/model/highlightColors";
import { productDocTextColors, productDocTextStyles } from "../formatting/ProductDocFormattingTools";
import { productDocToneColor } from "../formatting/productDocFormatting";
import { literalHeadingState, sectionIdState } from "../sections/nodes/sectionNodeState";
import { useProductDocSelectionToolbar } from "./useProductDocSelectionToolbar";
import styles from "./selection-toolbar.module.css";

function pointIsValid(point: PointType) {
  const node = $getNodeByKey(point.key);
  return point.type === "text"
    ? $isTextNode(node) && point.offset <= node.getTextContentSize()
    : $isElementNode(node) && point.offset <= node.getChildrenSize();
}

function ProductDocSelectionToolbar() {
  const editor = useCellValue(activeEditor$);
  const popup = useCellValue(editorRootElementRef$);
  const readOnly = useCellValue(readOnly$);
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const bubble = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuContents = useRef<HTMLDivElement>(null);
  const focusMenu = useRef(false);
  const [menu, setMenu] = useState<"style" | "color" | null>(null);
  const { saved, placement } = useProductDocSelectionToolbar(readOnly ? null : editor, bubble);
  const visible = Boolean(placement?.visible && !readOnly);

  useLayoutEffect(() => {
    if (!visible) setMenu(null);
  }, [visible]);
  useLayoutEffect(() => {
    if (menu && focusMenu.current) menuContents.current?.querySelector("button")?.focus({ preventScroll: true });
    focusMenu.current = false;
  }, [menu]);

  function apply(change: (selection: RangeSelection) => void) {
    const selection = saved.current?.clone();
    if (!editor || readOnly || !selection) return;
    const root = editor.getRootElement();
    if (root && root.ownerDocument.activeElement !== root) root.focus({ preventScroll: true });
    editor.update(() => {
      if (!pointIsValid(selection.anchor) || !pointIsValid(selection.focus)) return;
      $setSelection(selection);
      change(selection);
      const updated = $getSelection();
      saved.current = $isRangeSelection(updated) ? updated.clone() : null;
    }, { discrete: true, tag: SKIP_SCROLL_INTO_VIEW_TAG });
    setMenu(null);
  }

  const inlineTools = [
    ["bold", ru ? "Жирный" : "Bold", Bold],
    ["italic", ru ? "Курсив" : "Italic", Italic],
    ["underline", ru ? "Подчёркнутый" : "Underline", Underline],
    ["strikethrough", ru ? "Зачёркнутый" : "Strikethrough", Strikethrough],
  ] as const satisfies readonly [TextFormatType, string, typeof Bold][];
  const styleLabel = ru ? "Стиль текста" : "Text style";
  const colorLabel = ru ? "Цвет текста" : "Text color";

  if (!popup?.current) return null;
  return createPortal(<div ref={bubble} className={styles.bubble}
    role="group" aria-label={ru ? "Формат выделенного текста" : "Selected text formatting"}
    aria-hidden={!visible} aria-keyshortcuts="Alt+F10" data-visible={visible} data-below={placement?.below || undefined}
    data-menu-above={placement?.menuAbove || undefined}
    style={placement ? { left: placement.left, top: placement.top } : undefined}
    onMouseDown={(event) => event.preventDefault()}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMenu(null); }}
    onKeyDown={(event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (menu) {
        setMenu(null);
        menuTrigger.current?.focus({ preventScroll: true });
      } else {
        editor?.focus();
      }
    }}>
    <button type="button" tabIndex={visible ? 0 : -1} aria-label={styleLabel} title={styleLabel} aria-expanded={menu === "style"}
      onClick={(event) => {
        menuTrigger.current = event.currentTarget;
        focusMenu.current = event.detail === 0;
        setMenu(menu === "style" ? null : "style");
      }}>
      <Type size={16} aria-hidden="true" /><ChevronDown size={11} aria-hidden="true" />
    </button>
    <div className={styles.divider} aria-hidden="true" />
    {inlineTools.map(([format, label, Icon]) => <button key={format} type="button" tabIndex={visible ? 0 : -1} aria-label={label}
      title={label} aria-pressed={saved.current?.hasFormat(format) ?? false}
      onClick={() => apply((selection) => selection.formatText(format))}><Icon size={15} aria-hidden="true" /></button>)}
    <RawHighlightToolbar locale={locale} tabIndex={visible ? 0 : -1}
      onChoose={(color) => apply((selection) => $patchStyleText(selection, { [highlightStyleProperty]: color }))} />
    <div className={styles.divider} aria-hidden="true" />
    <button type="button" tabIndex={visible ? 0 : -1} aria-label={colorLabel} title={colorLabel} aria-expanded={menu === "color"}
      onClick={(event) => {
        menuTrigger.current = event.currentTarget;
        focusMenu.current = event.detail === 0;
        setMenu(menu === "color" ? null : "color");
      }}>
      <Baseline size={16} aria-hidden="true" /><ChevronDown size={11} aria-hidden="true" />
    </button>
    {visible && menu === "style" && <div ref={menuContents} className={styles.options} role="group" aria-label={styleLabel}>
      {productDocTextStyles(locale).map(({ value, label, create }) => <button key={value} type="button"
        onClick={() => apply((selection) => $setBlocksType(selection, create, (previous, next) => {
          $copyBlockFormatIndent(previous, next);
          if ($isHeadingNode(previous) && $isHeadingNode(next)) {
            $setState(next, sectionIdState, $getState(previous, sectionIdState));
            if (previous.getTag() === next.getTag()) $setState(next, literalHeadingState, $getState(previous, literalHeadingState));
          }
        }))}>{label}</button>)}
    </div>}
    {visible && menu === "color" && <div ref={menuContents} className={styles.options} data-color role="group" aria-label={colorLabel}>
      {productDocTextColors(locale).map(({ value, label }) => <button key={value} type="button" aria-label={label} title={label}
        onClick={() => apply((selection) => $patchStyleText(selection, { color: value === "default" ? null : productDocToneColor(value) }))}>
        <span className={styles.swatch} style={{ color: value === "default" ? "var(--falcon-text)" : productDocToneColor(value) }} aria-hidden="true" />
      </button>)}
    </div>}
  </div>, popup.current);
}

export const productDocSelectionToolbarPlugin = realmPlugin({
  init(realm) { realm.pub(addComposerChild$, ProductDocSelectionToolbar); },
});
