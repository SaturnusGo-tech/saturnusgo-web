"use client";

import { mergeRegister } from "@lexical/utils";
import { $isDirectiveNode } from "@mdxeditor/editor";
import { $createParagraphNode, $getNodeByKey, $isRootNode, type LexicalEditor, type NodeKey } from "lexical";
import { useCallback, useSyncExternalStore } from "react";
import { $createProductDocColumnNode, $createProductDocLayoutNode } from "../../draft/layouts/nodes/productDocLayoutNodes";
import type { LayoutRatio } from "../../draft/layouts/productDocLayoutBlocks";
import { runDirectiveName } from "../markdown/runDirective";

export type RunEmbedPosition = "left" | "center" | "right";

const layouts = {
  left: { count: 2, runColumn: 0, textColumn: 1, ratio: "right" },
  center: { count: 3, runColumn: 1, textColumn: 0, ratio: "sidebars" },
  right: { count: 2, runColumn: 1, textColumn: 0, ratio: "left" },
} as const satisfies Record<RunEmbedPosition, { count: number; runColumn: number; textColumn: number; ratio: LayoutRatio }>;

function $rootRunEmbed(key: NodeKey) {
  const node = $getNodeByKey(key);
  if ($isDirectiveNode(node) && node.getMdastNode().name === runDirectiveName && $isRootNode(node.getParent())) return node;
  return null;
}

export function $composeRunEmbed(key: NodeKey, position: RunEmbedPosition) {
  const run = $rootRunEmbed(key);
  if (!run) return null;

  const { count, runColumn, textColumn, ratio } = layouts[position];
  const layout = $createProductDocLayoutNode(ratio);
  run.insertBefore(layout);
  const columns = Array.from({ length: count }, () => $createProductDocColumnNode());
  layout.append(...columns);
  for (const [index, column] of columns.entries()) {
    column.append(index === runColumn ? run : $createParagraphNode());
  }
  if (!layout.getNextSibling()) layout.insertAfter($createParagraphNode());
  columns[textColumn].selectStart();
  return layout;
}

export function useRunEmbedCompose(editor: LexicalEditor, key: NodeKey) {
  const subscribe = useCallback((notify: () => void) => mergeRegister(
    editor.registerUpdateListener(notify),
    editor.registerEditableListener(notify),
  ), [editor]);
  const getSnapshot = useCallback(() => editor.isEditable()
    && editor.getEditorState().read(() => Boolean($rootRunEmbed(key))), [editor, key]);
  const available = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const compose = useCallback((position: RunEmbedPosition) => {
    if (!editor.isEditable() || !editor.getRootElement()) return;
    let changed = false;
    editor.update(() => { changed = Boolean($composeRunEmbed(key, position)); }, { discrete: true });
    if (changed) editor.focus();
  }, [editor, key]);
  return available ? compose : undefined;
}
