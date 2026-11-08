"use client";

import { activeEditor$, ButtonWithTooltip, currentSelection$, readOnly$, rootEditor$, useCellValue } from "@mdxeditor/editor";
import { $getNodeByKey, $getSelection, $isRangeSelection, type NodeKey } from "lexical";
import { ChevronDown, Columns2, Copy, Trash2 } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { ProductDocLayoutNode } from "../nodes/productDocLayoutNodes";
import { isProductDocColumnCount, productDocColumnCounts, type ColumnCount, type LayoutRatio } from "../productDocLayoutBlocks";
import {
  $duplicateProductDocLayout, $findProductDocLayout, $insertProductDocLayout,
  $removeProductDocLayout, $resizeProductDocLayout,
} from "../productDocLayouts";
import styles from "../layouts.module.css";

type LayoutSelection = { key: NodeKey; count: ColumnCount; ratio: LayoutRatio };

const ratioLabels = {
  en: { even: "Equal columns", left: "Left sidebar", right: "Right sidebar", sidebars: "Sidebars on both sides" },
  ru: { even: "Равные колонки", left: "Узкая колонка слева", right: "Узкая колонка справа", sidebars: "Узкие колонки по краям" },
};

function RatioIcon({ count, ratio }: { count: ColumnCount; ratio: LayoutRatio }) {
  const widths = ratio === "even" ? Array<number>(count).fill(1)
    : ratio === "sidebars" ? [1, 2, 1]
    : ratio === "left" ? [1, ...Array<number>(count - 1).fill(2)] : [...Array<number>(count - 1).fill(2), 1];
  return <span aria-hidden="true" className={styles.ratioIcon}>
    {widths.map((width, index) => <i key={index} style={{ flex: width }} />)}
  </span>;
}

export function ProductDocLayoutTools({ locale }: { locale: TmsLocale }) {
  const editor = useCellValue(rootEditor$);
  const active = useCellValue(activeEditor$);
  const currentSelection = useCellValue(currentSelection$);
  const readOnly = useCellValue(readOnly$);
  const [selected, setSelected] = useState<LayoutSelection | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [countMenu, setCountMenu] = useState(false);
  const controls = useRef<HTMLDivElement>(null);
  const countButton = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const ru = locale === "ru";
  const layoutKey = selected?.key;
  const editorRoot = editor?.getRootElement();
  const canvas = editorRoot?.closest(".mdxeditor-root-contenteditable");

  useEffect(() => {
    if (!editor || active !== editor || readOnly) {
      setSelected(null);
      return;
    }

    const selectLayout = (key?: NodeKey) => {
      const layout = key ? $findProductDocLayout($getNodeByKey(key)) : null;
      const count = layout?.getChildrenSize();
      if (!layout || count === undefined || !isProductDocColumnCount(count)) {
        setSelected(null);
        return;
      }
      const ratio = layout.getRatio();
      setSelected((previous) => previous?.key === layout.getKey() && previous.count === count && previous.ratio === ratio
        ? previous : { key: layout.getKey(), count, ratio });
    };

    editor.getEditorState().read(() => selectLayout(currentSelection?.anchor.key));
    return editor.registerUpdateListener(({ editorState }) => editorState.read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) selectLayout(selection.anchor.key);
    }));
  }, [active, currentSelection, editor, readOnly]);

  useLayoutEffect(() => {
    const layout = layoutKey && editor?.getElementByKey(layoutKey);
    if (!layout || !canvas) return;

    layout.dataset.docLayoutSelected = "true";
    const updatePosition = () => {
      const rect = layout.getBoundingClientRect();
      const origin = canvas.getBoundingClientRect();
      setPosition({ left: (rect.left + rect.right) / 2 - origin.left, top: rect.bottom - origin.top + 7 });
    };
    updatePosition();
    const resize = new ResizeObserver(updatePosition);
    resize.observe(layout);
    resize.observe(canvas);
    return () => {
      resize.disconnect();
      delete layout.dataset.docLayoutSelected;
    };
  }, [canvas, editor, layoutKey]);

  useEffect(() => {
    setCountMenu(false);
    if (!layoutKey || !editorRoot) return;
    const dismiss = (event: Event) => {
      if (!(event.target instanceof Node) || controls.current?.contains(event.target)) return;
      setCountMenu(false);
      if (!editorRoot.contains(event.target)) setSelected(null);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
    };
  }, [editorRoot, layoutKey]);

  function insertLayout() {
    if (!editor) return;
    editor.update(() => {
      const selection = $getSelection();
      const key = currentSelection?.anchor.key;
      const anchor = $isRangeSelection(selection) ? selection.anchor.getNode() : key ? $getNodeByKey(key) : null;
      $insertProductDocLayout(2, anchor);
    });
    editor.focus();
  }

  function changeLayout(action: (layout: ProductDocLayoutNode) => void) {
    if (!editor || !layoutKey) return;
    setCountMenu(false);
    editor.update(() => {
      const layout = $getNodeByKey(layoutKey);
      if (layout instanceof ProductDocLayoutNode) action(layout);
    });
    editor.focus();
  }

  if (!editor || active !== editor || readOnly) return null;

  const ratios: LayoutRatio[] = selected?.count === 3 ? ["even", "left", "sidebars", "right"]
    : selected?.count === 2 ? ["even", "left", "right"] : [];
  const countLabel = (count: ColumnCount) => ru ? `${count} ${count === 5 ? "колонок" : "колонки"}` : `${count} columns`;

  return <>
    <ButtonWithTooltip title={ru ? "Колонки" : "Layouts"}
      onMouseDown={(event) => event.preventDefault()} onClick={insertLayout}>
      <Columns2 size={16} />
    </ButtonWithTooltip>
    {canvas && selected ? createPortal(
      <div className={styles.layoutControls} style={position} ref={controls} role="group"
        data-editor-dialog aria-label={ru ? "Настройки колонок" : "Layout options"}
        onMouseDown={(event) => event.preventDefault()}>
        <div className={styles.layoutCount} onKeyDown={(event) => {
          if (countMenu && event.key === "Escape") {
            event.stopPropagation();
            setCountMenu(false);
            countButton.current?.focus();
          }
        }}>
          <button type="button" className={styles.layoutCountButton} ref={countButton} aria-expanded={countMenu}
            aria-controls={countMenu ? menuId : undefined} onClick={() => setCountMenu(!countMenu)}>
            {countLabel(selected.count)} <ChevronDown size={12} />
          </button>
          {countMenu ? <div className={styles.layoutCountOptions} id={menuId}>
            {productDocColumnCounts.map((count) => <button key={count} type="button"
              aria-pressed={selected.count === count}
              onClick={() => changeLayout((layout) => $resizeProductDocLayout(layout, count))}>
              <RatioIcon count={count} ratio="even" />
              {countLabel(count)}
            </button>)}
          </div> : null}
        </div>
        {ratios.length ? <div className={styles.layoutRatioOptions}>
          {ratios.map((ratio) => <button type="button" key={ratio} title={ratioLabels[locale][ratio]}
            aria-label={ratioLabels[locale][ratio]} aria-pressed={selected.ratio === ratio}
            onClick={() => changeLayout((layout) => layout.setRatio(ratio))}>
            <RatioIcon count={selected.count} ratio={ratio} />
          </button>)}
        </div> : null}
        <button type="button" className={styles.layoutDuplicate} title={ru ? "Дублировать колонки" : "Duplicate layout"}
          aria-label={ru ? "Дублировать колонки" : "Duplicate layout"} onClick={() => changeLayout($duplicateProductDocLayout)}>
          <Copy size={14} />
        </button>
        <button type="button" title={ru ? "Убрать колонки" : "Remove layout"}
          aria-label={ru ? "Убрать колонки" : "Remove layout"} onClick={() => changeLayout($removeProductDocLayout)}>
          <Trash2 size={14} />
        </button>
      </div>, canvas,
    ) : null}
  </>;
}
