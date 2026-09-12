import { createEditor, $getRoot, $isTextNode, $createParagraphNode, $createTextNode, $isParagraphNode, $isRootNode } from "lexical";
import { LinkNode, $createLinkNode, $isLinkNode } from "@lexical/link";
import { HeadingNode, $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { importMdastTreeToLexical, exportLexicalTreeToMdast, type MdastImportVisitor, type LexicalVisitor } from "@mdxeditor/editor";
import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { directive } from "micromark-extension-directive";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { gfm } from "micromark-extension-gfm";
import { gfmFromMarkdown, gfmToMarkdown } from "mdast-util-gfm";
import { highlightCodeImportVisitor, highlightExportVisitor, highlightImportVisitor } from "../../editor/highlightVisitors";

// Minimal standard visitors keep Node's ESM/CJS Lexical instances consistent while using
// the real MDXEditor traversal and our production visitors for every marker operation.
const imports: MdastImportVisitor<Nodes>[] = [highlightImportVisitor, highlightCodeImportVisitor,
  { testNode: "root", visitNode: ({ mdastNode, lexicalParent, actions }) => {
    if (mdastNode.type === "root") actions.visitChildren(mdastNode, lexicalParent);
  } },
  { testNode: "paragraph", visitNode: ({ actions }) => actions.addAndStepInto($createParagraphNode()) },
  { testNode: "heading", visitNode: ({ mdastNode, actions }) => {
    if (mdastNode.type === "heading") actions.addAndStepInto($createHeadingNode(`h${mdastNode.depth}`));
  } },
  { testNode: "text", visitNode: ({ mdastNode, actions }) => {
    if (mdastNode.type === "text") actions.addAndStepInto($createTextNode(mdastNode.value)
      .setStyle(actions.getParentStyle()).setFormat(actions.getParentFormatting()));
  } },
  { testNode: "link", visitNode: ({ mdastNode, actions }) => {
    if (mdastNode.type === "link") actions.addAndStepInto($createLinkNode(mdastNode.url));
  } },
  ...(["strong", "emphasis", "delete"] as const).map((type): MdastImportVisitor<Nodes> => ({
    testNode: type, visitNode: ({ mdastNode, lexicalParent, actions }) => {
      actions.addFormatting(type === "strong" ? 1 : type === "emphasis" ? 2 : 4);
      if ("children" in mdastNode) actions.visitChildren(mdastNode, lexicalParent);
    },
  })),
];
const exports: LexicalVisitor[] = [highlightExportVisitor,
  { testLexicalNode: $isRootNode, visitLexicalNode: ({ actions }) => actions.addAndStepInto("root") },
  { testLexicalNode: $isParagraphNode, visitLexicalNode: ({ actions }) => actions.addAndStepInto("paragraph") },
  { testLexicalNode: $isHeadingNode, visitLexicalNode: ({ lexicalNode, actions }) => {
    if ($isHeadingNode(lexicalNode)) actions.addAndStepInto("heading", { depth: Number(lexicalNode.getTag()[1]) });
  } },
  { testLexicalNode: $isLinkNode, visitLexicalNode: ({ lexicalNode, actions }) => {
    if ($isLinkNode(lexicalNode)) actions.addAndStepInto("link", { url: lexicalNode.getURL() });
  } },
  { testLexicalNode: $isTextNode, visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    actions.appendToParent(mdastParent, { type: "text", value: lexicalNode.getTextContent() });
  } },
];

export async function roundtrip(markdown: string) {
  const editor = createEditor({ nodes: [LinkNode, HeadingNode], onError: (error) => { throw error; } });
  let output = "", spans: { text: string; style: string; bold: boolean; code: boolean }[] = [];
  editor.update(() => {
    importMdastTreeToLexical({ root: $getRoot(), mdastRoot: fromMarkdown(markdown, {
      extensions: [gfm(), directive()], mdastExtensions: [gfmFromMarkdown(), directiveFromMarkdown()],
    }), visitors: imports, jsxComponentDescriptors: [], directiveDescriptors: [], codeBlockEditorDescriptors: [] });
    output = toMarkdown(exportLexicalTreeToMdast({ root: $getRoot(), visitors: exports, jsxComponentDescriptors: [], jsxIsAvailable: false }),
      { extensions: [gfmToMarkdown(), directiveToMarkdown()] }).trimEnd();
    spans = $getRoot().getAllTextNodes().filter($isTextNode).map((node) => ({
      text: node.getTextContent(), style: node.getStyle(), bold: node.hasFormat("bold"), code: node.hasFormat("code"),
    }));
  }, { discrete: true });
  return { output, spans };
}
