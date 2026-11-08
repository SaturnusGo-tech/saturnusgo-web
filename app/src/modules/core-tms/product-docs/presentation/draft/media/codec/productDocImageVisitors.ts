import { $createImageNode, $isImageNode, type ImageNode, type LexicalExportVisitor, type MdastImportVisitor } from "@mdxeditor/editor";
import type { Image } from "mdast";
import { readProductDocImageTitle, writeProductDocImageTitle } from "./productDocImageReference";

export const productDocImportImage: MdastImportVisitor<Image> = {
  priority: 10,
  testNode: "image",
  visitNode({ mdastNode, actions }) {
    const { title, width } = readProductDocImageTitle(mdastNode.title);
    actions.addAndStepInto($createImageNode({ src: mdastNode.url, altText: mdastNode.alt ?? "", title, width }));
  },
};

export const productDocExportImage: LexicalExportVisitor<ImageNode, Image> = {
  priority: 10,
  testLexicalNode: $isImageNode,
  visitLexicalNode({ lexicalNode, mdastParent, actions }) {
    actions.appendToParent(mdastParent, {
      type: "image",
      url: lexicalNode.getSrc(),
      alt: lexicalNode.getAltText(),
      title: writeProductDocImageTitle(lexicalNode.getTitle(), lexicalNode.getWidth()),
    });
  },
};
