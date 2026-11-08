import assert from "node:assert/strict";
import test from "node:test";
import {
  $createDirectiveNode, $isDirectiveNode, addExportVisitor$, addImportVisitor$, DirectiveNode, directivesPlugin,
  exportLexicalTreeToMdast, exportVisitors$, importMdastTreeToLexical, importVisitors$,
} from "@mdxeditor/editor";
import { Realm } from "@mdxeditor/gurx";
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, createEditor } from "lexical";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { directive } from "micromark-extension-directive";
import { ProductDocColumnNode, ProductDocLayoutNode } from "../../../draft/layouts/nodes/productDocLayoutNodes";
import { productDocLayoutsPlugin } from "../../../draft/layouts/productDocLayouts";
import { ProductDocBoundaryNode } from "../../../draft/sections/nodes/ProductDocBoundaryNode";
import { editorMarkdownToSections, sectionsToEditorMarkdown } from "../../../draft/sections/productDocMarkdown";
import { productDocSectionsPlugin } from "../../../draft/sections/productDocSections";
import { standardExport, standardImport } from "../../../draft/sections/tests/standardProductDocVisitors";
import { $composeRunEmbed } from "../../editor/useRunEmbedCompose";
import { runDirectiveName } from "../runDirective";

const snapshot = "runembed_307b2254-f756-4836-9957-8f43b356137a";
const attributes = { snapshot, align: "center", width: "76" };
const runDirective = `::falcon-run{snapshot="${snapshot}" align="center" width="76"}`;
const markdownExtensions = { extensions: [directive()], mdastExtensions: [directiveFromMarkdown()] };
const runDescriptor = {
  name: runDirectiveName, type: "leafDirective", attributes: Object.keys(attributes), hasChildren: false,
  testNode: (node: { type: string; name?: string }) => node.type === "leafDirective" && node.name === runDirectiveName,
  Editor: () => null,
} as const;

for (const [position, runColumn, textColumn, count, ratio] of [
  ["left", 0, 1, 2, "right"],
  ["center", 1, 0, 3, "sidebars"],
  ["right", 1, 0, 2, "left"],
] as const) {
  test(`compose ${position} keeps the original run reference and edits an adjacent column`, () => {
    const realm = new Realm();
    productDocLayoutsPlugin().init?.(realm);
    productDocSectionsPlugin().init?.(realm);
    directivesPlugin({ directiveDescriptors: [runDescriptor] }).init?.(realm);
    realm.pub(addExportVisitor$, standardExport);
    realm.pub(addImportVisitor$, standardImport);
    const editorOptions = {
      nodes: [ProductDocLayoutNode, ProductDocColumnNode, ProductDocBoundaryNode, DirectiveNode],
      onError: (error: Error) => { throw error; },
    };
    const editor = createEditor(editorOptions);
    editor.update(() => {
      const run = $createDirectiveNode({ type: "leafDirective", name: runDirectiveName, attributes, children: [] });
      const before = $createParagraphNode().append($createTextNode("Before the run"));
      const after = $createParagraphNode().append($createTextNode("After the run"));
      $getRoot().append(before, run, after);
      const layout = $composeRunEmbed(run.getKey(), position);
      assert.ok(layout instanceof ProductDocLayoutNode);
      assert.equal(layout.getChildrenSize(), count);
      assert.equal(layout.getRatio(), ratio);
      assert.equal(layout.getChildAtIndex<ProductDocColumnNode>(runColumn)?.getFirstChild()?.getKey(), run.getKey());
      assert.equal($composeRunEmbed(run.getKey(), position), null);
      $getSelection()?.insertText("Adjacent text");
      assert.equal(layout.getChildAtIndex(textColumn)?.getTextContent(), "Adjacent text");
    }, { discrete: true });

    const markdown = editor.getEditorState().read(() => toMarkdown(exportLexicalTreeToMdast({
      root: $getRoot(), visitors: realm.getValue(exportVisitors$), jsxComponentDescriptors: [], jsxIsAvailable: false,
    }), { extensions: [directiveToMarkdown()] }));
    const [saved] = editorMarkdownToSections(markdown, "intro");
    assert.equal(saved.markdown.split(/\r?\n/).filter((line) => line.trim() === runDirective).length, 1);
    const reopened = createEditor(editorOptions);
    reopened.update(() => {
      importMdastTreeToLexical({ root: $getRoot(), mdastRoot: fromMarkdown(sectionsToEditorMarkdown([saved]), markdownExtensions),
        visitors: realm.getValue(importVisitors$), jsxComponentDescriptors: [], directiveDescriptors: [runDescriptor],
        codeBlockEditorDescriptors: [] });
      const [before, layout, after] = $getRoot().getChildren().filter((node) => !(node instanceof ProductDocBoundaryNode));
      assert.equal(before.getTextContent(), "Before the run");
      assert.ok(layout instanceof ProductDocLayoutNode);
      const run = layout.getChildAtIndex<ProductDocColumnNode>(runColumn)?.getFirstChild();
      assert.ok($isDirectiveNode(run));
      assert.deepEqual(run.getMdastNode().attributes, attributes);
      assert.equal(layout.getChildAtIndex(textColumn)?.getTextContent(), "Adjacent text");
      assert.equal(after.getTextContent(), "After the run");
    }, { discrete: true });
  });
}
