"use client";

import { activeEditor$, currentSelection$ } from "@mdxeditor/editor";
import { useCellValues } from "@mdxeditor/gurx";
import { $getSelection, $isRangeSelection, $setSelection, type RangeSelection } from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { highlightStyleProperty, type HighlightColor } from "../model/highlightColors";

export function useHighlightToolbar() {
  const [editor, currentSelection] = useCellValues(activeEditor$, currentSelection$);
  const saved = useRef<RangeSelection | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const close = useCallback(() => setOpen(false), []);
  const remember = () => {
    editor?.getEditorState().read(() => {
      const selection = $getSelection();
      saved.current = $isRangeSelection(selection) ? selection.clone() : currentSelection?.clone() ?? null;
    });
  };
  useLayoutEffect(() => {
    if (!open || !menu.current || !button.current) return;
    const rect = button.current.getBoundingClientRect();
    const height = 106;
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 234)),
      top: rect.bottom + height + 8 > window.innerHeight ? Math.max(8, rect.top - height - 6) : rect.bottom + 6 });
    menu.current.showPopover();
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) close();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); button.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", key, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);
  const apply = (color: HighlightColor | null) => {
    if (!editor || !saved.current) return;
    editor.update(() => {
      const selection = saved.current!.clone();
      $setSelection(selection);
      $patchStyleText(selection, { [highlightStyleProperty]: color });
      // Reveal the stroke immediately instead of covering it with the native text selection.
      const end = selection.isBackward() ? selection.anchor : selection.focus;
      selection.anchor.set(end.key, end.offset, end.type);
      selection.focus.set(end.key, end.offset, end.type);
    });
    close();
    editor.focus();
  };
  return { button, menu, open, position, remember, apply,
    toggle: () => { if (!open) remember(); setOpen((value) => !value); } };
}
