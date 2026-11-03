import { $getRoot, $getSelection, $isRangeSelection, $setSelection, HISTORY_PUSH_TAG,
  type LexicalEditor, type RangeSelection } from "lexical";

/** Bind the exact editor/content/range, so a late picker cannot edit a different case. */
export function captureEmojiTarget(editor: LexicalEditor, current: RangeSelection | null) {
  if (!editor.isEditable()) return null;
  const original = JSON.stringify(editor.getEditorState().toJSON().root);
  let saved: RangeSelection | null = null;
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    saved = $isRangeSelection(selection) ? selection.clone() : current?.clone() ?? null;
  });
  return { apply(emoji: string) {
    if (!emoji || !editor.isEditable() || JSON.stringify(editor.getEditorState().toJSON().root) !== original) return false;
    let applied = false;
    editor.update(() => {
      if (saved) $setSelection(saved.clone());
      else $getRoot().selectEnd();
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      selection.insertText(emoji); applied = true;
    }, { discrete: true, tag: HISTORY_PUSH_TAG });
    if (applied) editor.getRootElement()?.focus({ preventScroll: true });
    return applied;
  } };
}
