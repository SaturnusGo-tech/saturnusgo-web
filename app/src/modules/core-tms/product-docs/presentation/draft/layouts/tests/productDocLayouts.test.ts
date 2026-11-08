import assert from "node:assert/strict";
import test from "node:test";
import { addExportVisitor$, exportLexicalTreeToMdast, exportVisitors$, importMdastTreeToLexical, importVisitors$ } from "@mdxeditor/editor";
import { Realm } from "@mdxeditor/gurx";
import { $createParagraphNode, $createTextNode, $getRoot, $isParagraphNode, createEditor } from "lexical";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { directive } from "micromark-extension-directive";
import { standardExport, standardImport } from "../../sections/tests/standardProductDocVisitors";
import { ProductDocColumnNode, ProductDocLayoutNode } from "../nodes/productDocLayoutNodes";
import { productDocLayoutRatio } from "../productDocLayoutBlocks";
import {
  $duplicateProductDocLayout, $insertProductDocLayout, $removeProductDocLayout, $resizeProductDocLayout, productDocLayoutsPlugin,
} from "../productDocLayouts";

test("column layouts preserve content across save, reopen, resize and removal", () => {
  const realm = new Realm();
  productDocLayoutsPlugin().init?.(realm);
  realm.pub(addExportVisitor$, standardExport);
  const create = () => createEditor({
    nodes: [ProductDocLayoutNode, ProductDocColumnNode],
    onError: (error) => { throw error; },
  });
  const exportDoc = () => toMarkdown(exportLexicalTreeToMdast({
    root: $getRoot(), visitors: realm.getValue(exportVisitors$), jsxComponentDescriptors: [], jsxIsAvailable: false,
  }), { extensions: [directiveToMarkdown()] });
  const source = create();
  source.update(() => {
    const intro = $createParagraphNode().append($createTextNode("Before layout"));
    $getRoot().append(intro);
    $insertProductDocLayout(5, intro);
    const layout = $getRoot().getChildAtIndex(1);
    assert.ok(layout instanceof ProductDocLayoutNode);
    for (const [index, column] of layout.getChildren<ProductDocColumnNode>().entries()) {
      const paragraph = column.getFirstChild();
      assert.ok($isParagraphNode(paragraph));
      paragraph.append($createTextNode(`Column ${index + 1}`));
    }
  }, { discrete: true });

  const saved = source.getEditorState().read(exportDoc);
  assert.match(saved, /::::falcon-columns/);
  assert.equal(saved.match(/:::falcon-column\n/g)?.length, 5);
  const reopened = create();
  reopened.update(() => {
    importMdastTreeToLexical({ root: $getRoot(), mdastRoot: fromMarkdown(saved, {
      extensions: [directive()], mdastExtensions: [directiveFromMarkdown()],
    }), visitors: [...realm.getValue(importVisitors$), ...standardImport],
    jsxComponentDescriptors: [], directiveDescriptors: [], codeBlockEditorDescriptors: [] });
    const layout = $getRoot().getChildAtIndex(1);
    assert.ok(layout instanceof ProductDocLayoutNode);
    assert.deepEqual(layout.getChildren().map((column) => column.getTextContent()), ["Column 1", "Column 2", "Column 3", "Column 4", "Column 5"]);
    $resizeProductDocLayout(layout, 2);
    assert.equal(layout.getChildrenSize(), 2);
    assert.match(layout.getLastChildOrThrow().getTextContent(), /Column 2\s+Column 3\s+Column 4\s+Column 5/);
    layout.setRatio("left");
  }, { discrete: true });
  const ratioMarkdown = reopened.getEditorState().read(exportDoc);
  assert.match(ratioMarkdown, /falcon-columns\{ratio="left"\}/);
  const node = fromMarkdown(ratioMarkdown, {
    extensions: [directive()], mdastExtensions: [directiveFromMarkdown()],
  }).children[1];
  assert.equal(node.type === "containerDirective" && productDocLayoutRatio(node), "left");
  reopened.update(() => {
    const layout = $getRoot().getChildAtIndex(1);
    assert.ok(layout instanceof ProductDocLayoutNode);
    $duplicateProductDocLayout(layout);
    const duplicate = layout.getNextSibling();
    assert.ok(duplicate instanceof ProductDocLayoutNode);
    assert.notEqual(duplicate.getFirstChildOrThrow().getKey(), layout.getFirstChildOrThrow().getKey());
    assert.equal(duplicate.getTextContent(), layout.getTextContent());
    assert.equal(duplicate.getRatio(), "left");
    duplicate.remove();
    $removeProductDocLayout(layout);
  }, { discrete: true });
  assert.equal(reopened.getEditorState().read(exportDoc), "Before layout\n\nColumn 1\n\nColumn 2\n\nColumn 3\n\nColumn 4\n\nColumn 5\n");
});
