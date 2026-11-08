import { addTableCellEditorChild$, createRootEditorSubscription$, realmPlugin, TableNode } from "@mdxeditor/editor";
import type { LexicalEditor } from "lexical";
import { ProductDocTableEditing } from "./editing/ProductDocTableEditing";

export function registerProductDocTableGuard(editor: LexicalEditor) {
  return editor.registerNodeTransform(TableNode, (table) => {
    // MDXEditor removes the table when the last row is deleted. Apply the same rule to columns.
    if (table.getColCount() === 0) table.remove();
  });
}

export const productDocTableGuardPlugin = realmPlugin({
  init(realm) {
    realm.pub(createRootEditorSubscription$, registerProductDocTableGuard);
    realm.pub(addTableCellEditorChild$, ProductDocTableEditing);
  },
});
