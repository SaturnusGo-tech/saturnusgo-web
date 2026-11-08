"use client";

import { $insertNodeToNearestRoot } from "@lexical/utils";
import { $createDirectiveNode, activeEditor$, currentSelection$, rootEditor$, useCellValue } from "@mdxeditor/editor";
import { $getNodeByKey, $getRoot, $getSelection, $isRangeSelection, $setSelection, type LexicalEditor, type RangeSelection } from "lexical";
import { useCallback } from "react";

export type EmbedInsertionTarget = { editor: LexicalEditor; selection: RangeSelection | null };

export function useEmbedPicker(launch: ((target: EmbedInsertionTarget) => void) | null) {
  const root = useCellValue(rootEditor$);
  const editor = useCellValue(activeEditor$);
  const currentSelection = useCellValue(currentSelection$);
  const open = useCallback((selection?: RangeSelection | null) => {
    if (!root || (editor && editor !== root)) return;
    const position = selection === undefined ? root.getEditorState().read(() => {
      const active = $getSelection();
      return $isRangeSelection(active) ? active.clone() : currentSelection?.clone() ?? null;
    }) : selection?.clone() ?? null;
    launch?.({ editor: root, selection: position });
  }, [root, editor, currentSelection, launch]);
  return launch && root && (!editor || root === editor) ? open : null;
}

export function insertEmbedDirective({ editor, selection }: EmbedInsertionTarget, name: string, snapshot: string) {
  if (!editor.getRootElement()) return;
  editor.update(() => {
    if (selection && $getNodeByKey(selection.anchor.key) && $getNodeByKey(selection.focus.key)) {
      const position = selection.clone();
      position.focus.set(position.anchor.key, position.anchor.offset, position.anchor.type);
      $setSelection(position);
    } else {
      $getRoot().selectEnd();
    }
    $insertNodeToNearestRoot($createDirectiveNode({
      type: "leafDirective", name, attributes: { snapshot }, children: [],
    }));
  }, { discrete: true });
}
