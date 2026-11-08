import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import type { LexicalVisitor, MdastImportVisitor } from "@mdxeditor/editor";
import { $createParagraphNode, $createTextNode, $isParagraphNode, $isRootNode, $isTextNode } from "lexical";
import type { Nodes } from "mdast";

export const standardImport: MdastImportVisitor<Nodes>[] = [
  { testNode: "root", visitNode({ mdastNode, lexicalParent, actions }) {
    if (mdastNode.type === "root") actions.visitChildren(mdastNode, lexicalParent);
  } },
  { testNode: "heading", visitNode({ mdastNode, actions }) {
    if (mdastNode.type === "heading") actions.addAndStepInto($createHeadingNode(`h${mdastNode.depth}`));
  } },
  { testNode: "paragraph", visitNode: ({ actions }) => actions.addAndStepInto($createParagraphNode()) },
  { testNode: "text", visitNode({ mdastNode, actions }) {
    if (mdastNode.type === "text") actions.addAndStepInto($createTextNode(mdastNode.value));
  } },
];
export const standardExport: LexicalVisitor[] = [
  { testLexicalNode: $isRootNode, visitLexicalNode: ({ actions }) => actions.addAndStepInto("root") },
  { testLexicalNode: $isParagraphNode, visitLexicalNode: ({ actions }) => actions.addAndStepInto("paragraph") },
  { testLexicalNode: $isHeadingNode, visitLexicalNode({ lexicalNode, actions }) {
    if ($isHeadingNode(lexicalNode)) actions.addAndStepInto("heading", { depth: Number(lexicalNode.getTag()[1]) });
  } },
  { testLexicalNode: $isTextNode, visitLexicalNode({ lexicalNode, mdastParent, actions }) {
    if (!$isTextNode(lexicalNode)) return;
    const text = { type: "text", value: lexicalNode.getTextContent() } as const;
    actions.appendToParent(mdastParent, lexicalNode.hasFormat("bold") ? { type: "strong", children: [text] } : text);
  } },
];
