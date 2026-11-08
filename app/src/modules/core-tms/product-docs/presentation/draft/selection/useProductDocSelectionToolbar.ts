"use client";

import { $getSelection, $isRangeSelection, type LexicalEditor, type RangeSelection } from "lexical";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";

type Placement = { left: number; top: number; below: boolean; format: number; visible: boolean };
const gap = 8;

function scrollContainer(root: HTMLElement) {
  for (let element = root.parentElement; element; element = element.parentElement) {
    if (/^(auto|scroll)$/.test(getComputedStyle(element).overflowY)) return element;
  }
}

export function useProductDocSelectionToolbar(
  editor: LexicalEditor | null, bubble: RefObject<HTMLDivElement | null>,
) {
  const saved = useRef<RangeSelection | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    if (!editor) return;
    let cleanup: (() => void) | undefined;
    const unregister = editor.registerRootListener((root) => {
      cleanup?.();
      saved.current = null;
      setPlacement(null);
      if (!root) return;

      const doc = root.ownerDocument;
      const view = doc.defaultView;
      if (!view) return;
      const scroll = scrollContainer(root);
      const toolbar = root.closest(".mdxeditor")?.querySelector(".mdxeditor-toolbar");
      let frame = 0;
      let dragging = false;
      let dismissed = false;
      const hide = () => setPlacement((previous) => previous?.visible ? { ...previous, visible: false } : previous);

      function locate() {
        frame = 0;
        const panel = bubble.current;
        if (!panel || dragging || dismissed || !view || !root) return;
        if (panel.contains(doc.activeElement)) return;
        const native = doc.getSelection();
        if (doc.activeElement !== root || !native || native.isCollapsed || !native.rangeCount
          || !root.contains(native.anchorNode) || !root.contains(native.focusNode)) {
          saved.current = null;
          hide();
          return;
        }
        const selection = editor?.getEditorState().read(() => {
          const range = $getSelection();
          return $isRangeSelection(range) && !range.isCollapsed() && range.getTextContent().trim() ? range.clone() : null;
        }) ?? null;
        if (!selection) {
          saved.current = null;
          hide();
          return;
        }

        const selected = native.getRangeAt(0).getBoundingClientRect();
        const boundary = scroll?.getBoundingClientRect();
        const topEdge = Math.max(0, boundary?.top ?? 0, toolbar?.getBoundingClientRect().bottom ?? 0);
        const bottomEdge = Math.min(view.innerHeight, boundary?.bottom ?? view.innerHeight);
        if (!selected.height || selected.bottom <= topEdge || selected.top >= bottomEdge) {
          hide();
          return;
        }

        const width = panel.offsetWidth;
        const height = panel.offsetHeight;
        const below = selected.top - height - gap < topEdge;
        const top = below ? selected.bottom + gap : selected.top - height - gap;
        if (top + height > bottomEdge) {
          hide();
          return;
        }
        saved.current = selection;
        const left = Math.max(gap, Math.min(view.innerWidth - width - gap, selected.left + (selected.width - width) / 2));
        setPlacement((previous) => previous?.visible && previous.left === left && previous.top === top
          && previous.below === below && previous.format === selection.format
          ? previous : { left, top, below, format: selection.format, visible: true });
      }

      function queue() {
        if (view && !frame) frame = view.requestAnimationFrame(locate);
      }
      function selectionChanged() {
        dismissed = false;
        queue();
      }
      function pointerDown(event: PointerEvent) {
        if (bubble.current?.contains(event.target as Node)) return;
        dragging = root?.contains(event.target as Node) ?? false;
        dismissed = !dragging;
        saved.current = null;
        hide();
      }
      function pointerUp() {
        if (!dragging) return;
        dragging = false;
        queue();
      }
      function keyDown(event: KeyboardEvent) {
        if (event.key === "Escape" && bubble.current?.dataset.visible === "true") {
          dismissed = true;
          saved.current = null;
          hide();
          return;
        }
        if (event.altKey && event.key === "F10" && saved.current && bubble.current?.dataset.visible === "true"
          && root?.contains(event.target as Node)) {
          event.preventDefault();
          bubble.current.querySelector("button")?.focus({ preventScroll: true });
        }
      }

      doc.addEventListener("selectionchange", selectionChanged);
      doc.addEventListener("focusin", queue);
      doc.addEventListener("pointerdown", pointerDown, true);
      doc.addEventListener("pointerup", pointerUp);
      doc.addEventListener("pointercancel", pointerUp);
      root.addEventListener("keydown", keyDown);
      view.addEventListener("resize", queue);
      view.addEventListener("scroll", queue, true);
      const unregisterUpdate = editor.registerUpdateListener(queue);
      cleanup = () => {
        unregisterUpdate();
        view.cancelAnimationFrame(frame);
        doc.removeEventListener("selectionchange", selectionChanged);
        doc.removeEventListener("focusin", queue);
        doc.removeEventListener("pointerdown", pointerDown, true);
        doc.removeEventListener("pointerup", pointerUp);
        doc.removeEventListener("pointercancel", pointerUp);
        root.removeEventListener("keydown", keyDown);
        view.removeEventListener("resize", queue);
        view.removeEventListener("scroll", queue, true);
      };
      queue();
    });
    return () => {
      cleanup?.();
      unregister();
    };
  }, [editor, bubble]);

  return { saved, placement };
}
