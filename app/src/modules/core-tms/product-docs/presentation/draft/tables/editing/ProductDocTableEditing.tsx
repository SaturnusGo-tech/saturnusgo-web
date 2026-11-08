import { $createTableNode, $isTableNode, NESTED_EDITOR_UPDATED_COMMAND } from "@mdxeditor/editor";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode, $getNodeByKey, $getRoot,
  CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_HIGH, HISTORY_PUSH_TAG, PASTE_TAG,
  REDO_COMMAND, UNDO_COMMAND, type LexicalEditor, type NodeKey,
} from "lexical";
import { useEffect } from "react";
import { parseProductDocTableClipboard } from "./model/productDocTableClipboard";
import { applyProductDocTablePaste, canGrowProductDocTableOnTab } from "./model/productDocTableEdits";
import { focusProductDocTableCell, productDocTableLocation } from "./productDocTableLocation";

const structuralEdits = new WeakMap<LexicalEditor, Set<NodeKey>>();

function rememberEdit(parent: LexicalEditor, ...keys: NodeKey[]) {
  structuralEdits.set(parent, new Set(keys));
}

function consume(event: Event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

export function ProductDocTableEditing() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let canUndoCell = false;
    let canRedoCell = false;
    const useParentHistory = (redo: boolean) => {
      if (redo ? canRedoCell : canUndoCell) return false;
      const location = productDocTableLocation(editor);
      if (!location || !structuralEdits.get(location.parent)?.has(location.tableKey)) return false;
      const handled = location.parent.dispatchCommand(redo ? REDO_COMMAND : UNDO_COMMAND, undefined);
      if (handled) requestAnimationFrame(() => {
        // History may remove the nested editor which currently owns focus.
        if (!editor.getRootElement()?.isConnected) location.parent.focus();
      });
      return handled;
    };
    function onKeyDown(event: KeyboardEvent) {
      if (!editor.isEditable() || event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key !== "Escape" && (event.key !== "Tab" || event.shiftKey || event.repeat)) return;
      const location = productDocTableLocation(editor);
      if (!location) return;
      const { table, parent, tableKey, row, column } = location;
      const rows = table.children.length;
      const columns = table.children[0]?.children.length ?? 0;
      if (event.key === "Tab") {
        if (row !== rows - 1 || column !== columns - 1) return;
        const hasCurrentCell = editor.getEditorState().read(() => Boolean($getRoot().getTextContent().trim()));
        const lastRowHasContent = hasCurrentCell || table.children[row].children.some((cell, index) => index !== column && cell.children.length > 0);
        if (!canGrowProductDocTableOnTab({ rows, columns, row, column, lastRowHasContent })) return;
      }
      consume(event);
      editor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined);
      parent.update(() => {
        const current = $getNodeByKey(tableKey);
        if (!$isTableNode(current)) return;
        if (event.key === "Escape") {
          if (current.getNextSibling()) current.selectNext();
          else {
            const paragraph = $createParagraphNode();
            current.insertAfter(paragraph);
            paragraph.select();
          }
          return;
        }
        current.addRowToBottom();
        rememberEdit(parent, tableKey);
        focusProductDocTableCell(parent, tableKey, rows, 0);
      }, { discrete: true, tag: event.key === "Tab" ? HISTORY_PUSH_TAG : undefined });
    }

    function onPaste(event: ClipboardEvent) {
      if (!editor.isEditable() || event.defaultPrevented || editor.isComposing() || !event.clipboardData || event.clipboardData.files.length) return;
      const typed = event.clipboardData.getData("text/tab-separated-values");
      const pasted = parseProductDocTableClipboard(typed || event.clipboardData.getData("text/plain"), Boolean(typed));
      if (!pasted) return;
      const location = productDocTableLocation(editor);
      if (!location) return;
      const { table, parent, tableKey, row, column } = location;
      const next = applyProductDocTablePaste(table, row, column, pasted);
      if (!next) return;
      consume(event);
      editor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined);
      parent.update(() => {
        const current = $getNodeByKey(tableKey);
        if (!$isTableNode(current)) return;
        const replacement = $createTableNode(next);
        current.replace(replacement);
        rememberEdit(parent, tableKey, replacement.getKey());
        focusProductDocTableCell(parent, replacement.getKey(), row, column);
      }, { discrete: true, tag: [PASTE_TAG, HISTORY_PUSH_TAG] });
    }

    return mergeRegister(
      editor.registerRootListener((root, previous) => {
        previous?.removeEventListener("keydown", onKeyDown, true);
        previous?.removeEventListener("paste", onPaste, true);
        root?.addEventListener("keydown", onKeyDown, true);
        root?.addEventListener("paste", onPaste, true);
      }),
      editor.registerCommand(CAN_UNDO_COMMAND, (value) => { canUndoCell = value; return false; }, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(CAN_REDO_COMMAND, (value) => { canRedoCell = value; return false; }, COMMAND_PRIORITY_HIGH),
      editor.registerCommand(UNDO_COMMAND, () => useParentHistory(false), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(REDO_COMMAND, () => useParentHistory(true), COMMAND_PRIORITY_HIGH),
    );
  }, [editor]);
  return null;
}
