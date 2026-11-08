import assert from "node:assert/strict";
import test from "node:test";
import { $createTableNode, TableNode } from "@mdxeditor/editor";
import { $getRoot, createEditor } from "lexical";
import { registerProductDocTableGuard } from "../productDocTableGuard";

test("deleting the last column removes the empty table", () => {
  const editor = createEditor({ nodes: [TableNode], onError: (error) => { throw error; } });
  registerProductDocTableGuard(editor);
  editor.update(() => {
    $getRoot().append($createTableNode({
      type: "table",
      children: [{ type: "tableRow", children: [{ type: "tableCell", children: [] }] }],
    }));
  }, { discrete: true });
  editor.getEditorState().read(() => assert.equal($getRoot().getChildrenSize(), 1));
  editor.update(() => {
    $getRoot().getFirstChildOrThrow<TableNode>().deleteColumnAt(0);
  }, { discrete: true });
  editor.getEditorState().read(() => assert.equal($getRoot().getChildrenSize(), 0));
});
