import assert from "node:assert/strict";
import test from "node:test";
import { Realm } from "@mdxeditor/gurx";
import { $isImageNode, addExportVisitor$, addImportVisitor$, exportLexicalTreeToMdast, exportVisitors$, ImageNode, imagePlugin,
  importMdastTreeToLexical, importVisitors$ } from "@mdxeditor/editor";
import { $createParagraphNode, $createTextNode, $getRoot, $isParagraphNode, createEditor } from "lexical";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { standardExport, standardImport } from "../../../sections/tests/standardProductDocVisitors";
import { captureImageTarget, insertProductDocImages } from "../../insertion/productDocImageInsertion";
import { imageAttachmentReference, productDocImageAttachmentId, readProductDocImageTitle, writeProductDocImageTitle } from "../productDocImageReference";
import { productDocExportImage, productDocImportImage } from "../productDocImageVisitors";

test("an uploaded image keeps its placement, alt text and resized width when the draft reopens", () => {
  const realm = new Realm();
  imagePlugin().init?.(realm);
  realm.pub(addImportVisitor$, [...standardImport, productDocImportImage]);
  realm.pub(addExportVisitor$, [...standardExport, productDocExportImage]);
  const editor = createEditor({ nodes: [ImageNode], onError: (error) => { throw error; } });
  const url = imageAttachmentReference("attachment_project_image");
  editor.update(() => {
    const first = $createTextNode("Before and after");
    $getRoot().append($createParagraphNode().append(first));
    first.select(6, 6);
  }, { discrete: true });
  insertProductDocImages(captureImageTarget(editor), [url]);

  editor.update(() => {
    const paragraph = $getRoot().getFirstChildOrThrow();
    assert.ok($isParagraphNode(paragraph));
    const nodes = paragraph.getChildren();
    assert.equal(nodes[0].getTextContent(), "Before");
    assert.equal(nodes[2].getTextContent(), " and after");
    const image = nodes[1];
    assert.ok($isImageNode(image));
    image.setWidthAndHeight(384, "inherit");
    image.setAltText("Captured test result");
  }, { discrete: true });

  const saved = editor.getEditorState().read(() => toMarkdown(exportLexicalTreeToMdast({
    root: $getRoot(), visitors: realm.getValue(exportVisitors$), jsxComponentDescriptors: [], jsxIsAvailable: false,
  })));
  assert.match(saved, /^Before!\[Captured test result\]\(\/falcon\/product-doc-images\/attachment_project_image "falcon:image-width:384:"\) and after/m);
  assert.doesNotMatch(saved, /<img|blob:|data:/);

  editor.update(() => {
    const root = $getRoot().clear();
    importMdastTreeToLexical({
      root, mdastRoot: fromMarkdown(saved), visitors: realm.getValue(importVisitors$),
      jsxComponentDescriptors: [], directiveDescriptors: [], codeBlockEditorDescriptors: [],
    });
    const paragraph = root.getFirstChildOrThrow();
    assert.ok($isParagraphNode(paragraph));
    const image = paragraph.getChildren().find($isImageNode);
    assert.ok($isImageNode(image));
    assert.equal(image.getWidth(), 384);
    assert.equal(image.getAltText(), "Captured test result");
    assert.equal(productDocImageAttachmentId(image.getSrc()), "attachment_project_image");
  }, { discrete: true });
});

test("ordinary Markdown image titles stay intact and forged attachment references are rejected", () => {
  const title = 'Before opening, confirm the “expected result”';
  assert.deepEqual(readProductDocImageTitle(writeProductDocImageTitle(title, 480)), { title, width: 480 });
  assert.deepEqual(readProductDocImageTitle(writeProductDocImageTitle(title, "inherit")), { title, width: undefined });
  const unusualTitle = "falcon:image-width:17:part of the actual title";
  assert.deepEqual(readProductDocImageTitle(writeProductDocImageTitle(unusualTitle, "inherit")), { title: unusualTitle, width: undefined });
  assert.equal(productDocImageAttachmentId("/falcon/product-doc-images/../secret"), null);
  assert.equal(productDocImageAttachmentId("https://example.test/falcon/product-doc-images/attachment_test"), null);
});
