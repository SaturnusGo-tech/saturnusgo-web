import type { LexicalExportVisitor, MdastImportVisitor, FORMAT } from "@mdxeditor/editor";
import { $createTextNode, $createParagraphNode, $isElementNode, $isRootNode, $isTextNode, type TextNode } from "lexical";
import type { Nodes, Parent, PhrasingContent } from "mdast";
import type { Directives, TextDirective } from "mdast-util-directive";
import { highlightFromStyle, highlightStyle } from "../model/highlightColors";
import { directiveLiteral, highlightColorOf, highlightedNode } from "../model/highlightSyntax";

type ImportActions = Parameters<MdastImportVisitor<Directives>["visitNode"]>[0]["actions"];
function inheritMarker(node: Parent, style: string, actions: ImportActions) {
  const color = highlightColorOf(node as Nodes);
  const nextStyle = color ? highlightStyle(color) : style;
  actions.addStyle(nextStyle, node);
  for (const child of node.children) if ("children" in child) inheritMarker(child, nextStyle, actions);
}

export const highlightImportVisitor: MdastImportVisitor<Directives> = {
  priority: 100,
  testNode: (node) => ["textDirective", "leafDirective", "containerDirective"].includes(node.type),
  visitNode({ mdastNode, lexicalParent, actions }) {
    const color = highlightColorOf(mdastNode);
    if (!color) {
      const literal = $createTextNode(directiveLiteral(mdastNode))
        .setFormat(actions.getParentFormatting()).setStyle(actions.getParentStyle());
      if ($isElementNode(lexicalParent)) lexicalParent.append($isRootNode(lexicalParent) ? $createParagraphNode().append(literal) : literal);
      return;
    }
    inheritMarker(mdastNode, highlightStyle(color), actions);
    actions.addFormatting(actions.getParentFormatting() as FORMAT);
    actions.visitChildren(mdastNode, lexicalParent);
  },
};

export const highlightCodeImportVisitor: MdastImportVisitor<Extract<Nodes, { type: "inlineCode" }>> = {
  priority: 100,
  testNode: "inlineCode",
  visitNode({ mdastNode, actions }) {
    actions.addAndStepInto($createTextNode(mdastNode.value)
      .setFormat(actions.getParentFormatting()).toggleFormat("code").setStyle(actions.getParentStyle()));
  },
};

export function markedTextToMdast(node: TextNode): TextDirective | null {
  const color = highlightFromStyle(node.getStyle());
  const text = node.getTextContent().trim();
  if (!color || !text) return null;
  let content: PhrasingContent = node.hasFormat("code")
    ? { type: "inlineCode", value: text }
    : { type: "text", value: text };
  if (node.hasFormat("strikethrough")) content = { type: "delete", children: [content] };
  if (node.hasFormat("italic")) content = { type: "emphasis", children: [content] };
  if (node.hasFormat("bold")) content = { type: "strong", children: [content] };
  return highlightedNode(color, [content]);
}

export const highlightExportVisitor: LexicalExportVisitor<TextNode, TextDirective> = {
  priority: 100,
  testLexicalNode: (node): node is TextNode => $isTextNode(node) && Boolean(highlightFromStyle(node.getStyle())),
  visitLexicalNode({ lexicalNode, mdastParent, actions }) {
    const text = lexicalNode.getTextContent();
    const marked = markedTextToMdast(lexicalNode);
    if (!marked) { actions.appendToParent(mdastParent, { type: "text", value: text }); return; }
    const leading = /^\s+/.exec(text)?.[0] ?? "", trailing = /\s+$/.exec(text)?.[0] ?? "";
    if (leading) actions.appendToParent(mdastParent, { type: "text", value: leading });
    actions.appendToParent(mdastParent, marked);
    if (trailing) actions.appendToParent(mdastParent, { type: "text", value: trailing });
  },
  shouldJoin: (previous, current) => current.type === "textDirective"
    && previous.type === "textDirective" && Boolean(highlightColorOf(previous))
    && highlightColorOf(previous) === highlightColorOf(current),
  join: (previous, current) => ({ ...previous, children: [
    ...("children" in previous ? previous.children : []),
    ...("children" in current ? current.children : []),
  ] }),
};
