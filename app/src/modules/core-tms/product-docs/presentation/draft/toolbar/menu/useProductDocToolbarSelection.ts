import { activeEditor$, currentSelection$, useCellValue } from "@mdxeditor/editor";
import { $getNodeByKey, $getSelection, $isRangeSelection, $setSelection, type RangeSelection } from "lexical";
import { useRef, type KeyboardEvent } from "react";

export function useProductDocToolbarSelection() {
  const editor = useCellValue(activeEditor$);
  const currentSelection = useCellValue(currentSelection$);
  const saved = useRef<RangeSelection | null>(null);

  function remember() {
    saved.current = editor?.getEditorState().read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? selection.clone() : currentSelection?.clone() ?? null;
    }) ?? null;
  }

  function rememberOnKey(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown" || event.key === "ArrowUp") remember();
  }

  function restore() {
    const selection = saved.current ?? currentSelection;
    saved.current = null;
    if (!editor || !selection) return;
    editor.update(() => {
      if ($getNodeByKey(selection.anchor.key) && $getNodeByKey(selection.focus.key)) {
        $setSelection(selection.clone());
      }
    }, { discrete: true });
  }

  function focusEditor() {
    requestAnimationFrame(() => { if (editor?.getRootElement()?.isConnected) editor.focus(); });
  }

  return { remember, rememberOnKey, restore, focusEditor };
}
