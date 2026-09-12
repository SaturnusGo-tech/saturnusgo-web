import { getSelectionAsMarkdown } from "@mdxeditor/editor";
import { $getRoot, $getSelection, $isElementNode, $isRangeSelection, $setSelection, HISTORY_PUSH_TAG,
  type BaseSelection, type LexicalEditor, type LexicalNode } from "lexical";
import type { WritingTarget } from "../../../../../../writing-assistant/model/target";
import { fullMarkdown, type MarkdownExportParameters } from "./serialization/markdownSerialization";
import { animateReplacement } from "./motion/animateReplacement";

/** Capture node positions, not a string search: duplicate text must never redirect an edit. */
export function captureMarkdownTarget(editor: LexicalEditor, parameters: MarkdownExportParameters,
  insertMarkdown: (markdown: string) => void, canImport: (markdown: string) => boolean = () => true,
  insertInline: (markdown: string) => boolean = () => false): WritingTarget | null {
  const element = editor.getRootElement();
  if (!element?.isConnected || !editor.isEditable()) return null;
  const root: HTMLElement = element;
  const original = contentSnapshot(editor);
  let selection: BaseSelection | null = null;
  editor.getEditorState().read(() => {
    const current = $getSelection();
    selection = current?.clone() ?? null;
  }, { editor });
  const captured = selection as BaseSelection | null;
  const selected = Boolean(captured && (!$isRangeSelection(captured) || !captured.isCollapsed()));
  let text: string;
  try {
    text = selected ? getSelectionAsMarkdown(editor, parameters) : fullMarkdown(editor, parameters);
  } catch { return null; }
  if (selected && !text.trim()) return null;
  let applied = false;
  const unchanged = () => !applied && editor.isEditable() && editor.getRootElement() === root && root.isConnected
    && contentSnapshot(editor) === original;
  function restore() {
    if (!root.isConnected || editor.getRootElement() !== root || !editor.isEditable()) return;
    if (unchanged() && captured) editor.update(() => { $setSelection(captured.clone()); }, { discrete: true });
    root.focus({ preventScroll: true });
  }
  return {
    text, selected, restore,
    apply(markdown) {
      if (!unchanged() || !markdown.trim() || !canImport(markdown)) return false;
      let committed = false;
      try {
        root.focus({ preventScroll: true });
        editor.update(() => {
          if (selected && captured) {
            $setSelection(captured.clone());
            // Resolve captured keys before inserting; external replacements may retain equal text.
            if (!$getSelection()?.getNodes().length) return;
          } else $getRoot().select(0, $getRoot().getChildrenSize());
          if (!isPartialBlock() || !insertInline(markdown)) insertMarkdown(markdown);
          committed = true;
        }, { discrete: true, tag: HISTORY_PUSH_TAG });
      } catch { return false; }
      if (committed) { applied = true; editor.focus(undefined, { defaultSelection: "rootEnd" }); animateReplacement(root); }
      return committed;
    },
  };
}

function isPartialBlock() {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed()) return false;
  const block = (node: LexicalNode) => {
    let current: LexicalNode | null = node;
    while (current && (!$isElementNode(current) || current.isInline())) current = current.getParent();
    return current;
  };
  const anchor = block(selection.anchor.getNode()), focus = block(selection.focus.getNode());
  return Boolean(anchor && focus && anchor.is(focus) && anchor.getType() !== "root"
    && selection.getTextContent().length < anchor.getTextContent().length);
}

function contentSnapshot(editor: LexicalEditor) {
  const state = editor.getEditorState();
  return state.read(() => {
    const keys = (node: LexicalNode): unknown => [node.getKey(), ...($isElementNode(node) ? node.getChildren().map(keys) : [])];
    return JSON.stringify([state.toJSON().root, keys($getRoot())]);
  }, { editor });
}
