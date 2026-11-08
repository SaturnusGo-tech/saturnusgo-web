import { $isTableNode } from "@mdxeditor/editor";
import { $getNearestNodeFromDOMNode, getNearestEditorFromDOMNode, type LexicalEditor, type NodeKey } from "lexical";

export function productDocTableLocation(editor: LexicalEditor) {
  const cell = editor.getRootElement()?.closest<HTMLTableCellElement>("td[data-active], th[data-active]");
  const table = cell?.closest("table");
  const row = cell?.parentElement;
  const parent = table?.parentElement && getNearestEditorFromDOMNode(table.parentElement);
  if (!cell || !table || !(row instanceof HTMLTableRowElement) || !parent || parent === editor) return null;
  const column = Array.from(row.cells).filter((cell) => cell.hasAttribute("data-active")).indexOf(cell);
  if (column < 0) return null;
  const state = parent.getEditorState();
  return state.read(() => {
    const node = $getNearestNodeFromDOMNode(table, state);
    return $isTableNode(node) ? {
      parent, tableKey: node.getKey(), row: row.sectionRowIndex, column, table: node.getMdastNode(),
    } : null;
  }, { editor: parent });
}

export function focusProductDocTableCell(parent: LexicalEditor, tableKey: NodeKey, row: number, column: number) {
  function focus(retry: boolean) {
    const table = parent.getElementByKey(tableKey)?.querySelector("table");
    const targetRow = table?.tBodies[0]?.rows[row];
    const cell = targetRow && Array.from(targetRow.cells).filter((cell) => cell.hasAttribute("data-active"))[column];
    const editable = cell?.querySelector<HTMLElement>('[contenteditable="true"]');
    const editor = editable && getNearestEditorFromDOMNode(editable);
    if (editor?.isEditable()) editor.focus(undefined, { defaultSelection: "rootEnd" });
    else if (retry) requestAnimationFrame(() => focus(false));
  }
  requestAnimationFrame(() => focus(true));
}
