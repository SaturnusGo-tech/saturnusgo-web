import {
  addExportVisitor$, addImportVisitor$, addMdastExtension$, addToMarkdownExtension$, IS_BOLD, IS_CODE, IS_HIGHLIGHT, IS_ITALIC, IS_STRIKETHROUGH,
  IS_SUBSCRIPT, IS_SUPERSCRIPT, IS_UNDERLINE, realmPlugin, type LexicalExportVisitor, type MdastImportVisitor,
} from "@mdxeditor/editor";
import {
  $createParagraphNode, $isElementNode, $isParagraphNode, $isTextNode, type ParagraphNode, type TextNode,
} from "lexical";
import type { Paragraph, PhrasingContent } from "mdast";
import type { ContainerDirective, TextDirective } from "mdast-util-directive";
import { highlightCodeImportVisitor, highlightImportVisitor } from "../../../../presentation/cases/inspector/markdown/highlight/editor/highlightVisitors";
import { highlightFromStyle } from "../../../../presentation/cases/inspector/markdown/highlight/model/highlightColors";
import { highlightedNode } from "../../../../presentation/cases/inspector/markdown/highlight/model/highlightSyntax";
import { normalizeMarkerLinks } from "../../../../presentation/cases/inspector/markdown/highlight/serialization/highlightLinks";
import { highlightToMarkdown } from "../../../../presentation/cases/inspector/markdown/highlight/serialization/highlightSerialization";

const tones = {
  muted: "text-secondary",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
} as const;

export type ProductDocTone = keyof typeof tones;

export function isProductDocTone(value: unknown): value is ProductDocTone {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(tones, value);
}

export function productDocToneColor(tone: ProductDocTone) {
  return `var(--falcon-${tones[tone]})`;
}

function textTone(node: TextNode) {
  const color = /(?:^|;)\s*color\s*:\s*([^;]+?)\s*(?:;|$)/.exec(node.getStyle())?.[1];
  return (Object.keys(tones) as ProductDocTone[]).find((tone) => color === productDocToneColor(tone));
}

const importAlignment: MdastImportVisitor<ContainerDirective> = {
  priority: 110,
  testNode: (node) => node.type === "containerDirective" && node.name === "falcon-align",
  visitNode({ mdastNode, lexicalParent, actions }) {
    const mode = mdastNode.attributes?.mode;
    const content = mdastNode.children[0];
    if ((mode !== "center" && mode !== "right") || mdastNode.children.length !== 1 || content?.type !== "paragraph"
      || !$isElementNode(lexicalParent)) {
      actions.visitChildren(mdastNode, lexicalParent);
      return;
    }
    const paragraph = $createParagraphNode().setFormat(mode);
    lexicalParent.append(paragraph);
    actions.visitChildren(content, paragraph);
  },
};

const exportAlignment: LexicalExportVisitor<ParagraphNode, ContainerDirective> = {
  priority: 110,
  testLexicalNode: $isParagraphNode,
  visitLexicalNode({ lexicalNode, mdastParent, actions }) {
    const mode = lexicalNode.getFormatType();
    if ((mode !== "center" && mode !== "right") || lexicalNode.isEmpty()) return actions.nextVisitor();
    const paragraph: Paragraph = { type: "paragraph", children: [] };
    actions.visitChildren(lexicalNode, paragraph);
    actions.appendToParent(mdastParent, {
      type: "containerDirective", name: "falcon-align", attributes: { mode }, children: [paragraph],
    });
  },
};

const importColor: MdastImportVisitor<TextDirective> = {
  priority: 110,
  testNode: (node) => node.type === "textDirective" && node.name === "falcon-color",
  visitNode({ mdastNode, lexicalParent, actions }) {
    const tone = mdastNode.attributes?.tone;
    const inherited = actions.getParentFormatting();
    for (const flag of [IS_BOLD, IS_ITALIC, IS_STRIKETHROUGH, IS_UNDERLINE, IS_CODE, IS_SUBSCRIPT, IS_SUPERSCRIPT, IS_HIGHLIGHT] as const) {
      if (inherited & flag) actions.addFormatting(flag);
    }
    if (!$isElementNode(lexicalParent) || !isProductDocTone(tone)) {
      actions.visitChildren(mdastNode, lexicalParent);
      return;
    }
    const previousChildren = lexicalParent.getChildrenSize();
    actions.visitChildren(mdastNode, lexicalParent);
    for (const child of lexicalParent.getChildren().slice(previousChildren)) {
      const texts = $isTextNode(child) ? [child] : $isElementNode(child) ? child.getAllTextNodes() : [];
      for (const node of texts) {
        if (!textTone(node)) node.setStyle(`${node.getStyle()} color: ${productDocToneColor(tone)};`.trim());
      }
    }
  },
};

const importUnderline: MdastImportVisitor<TextDirective> = {
  priority: 110,
  testNode: (node) => node.type === "textDirective" && node.name === "falcon-underline",
  visitNode({ mdastNode, lexicalParent, actions }) {
    actions.addFormatting(IS_UNDERLINE);
    actions.visitChildren(mdastNode, lexicalParent);
  },
};

const exportInlineFormatting: LexicalExportVisitor<TextNode, TextDirective> = {
  priority: 110,
  testLexicalNode: $isTextNode,
  visitLexicalNode({ lexicalNode, mdastParent, actions }) {
    const tone = textTone(lexicalNode);
    const underline = lexicalNode.hasFormat("underline");
    const marker = highlightFromStyle(lexicalNode.getStyle());
    if (!tone && !underline && !marker) return actions.nextVisitor();
    const text = lexicalNode.getTextContent();
    const value = text.trim();
    if (!value) return actions.nextVisitor();
    let child: PhrasingContent = lexicalNode.hasFormat("code")
      ? { type: "inlineCode", value } : { type: "text", value };
    if (lexicalNode.hasFormat("strikethrough")) child = { type: "delete", children: [child] };
    if (lexicalNode.hasFormat("bold")) child = { type: "strong", children: [child] };
    if (lexicalNode.hasFormat("italic")) child = { type: "emphasis", children: [child] };
    if (underline) child = { type: "textDirective", name: "falcon-underline", children: [child] };
    if (tone) child = { type: "textDirective", name: "falcon-color", attributes: { tone }, children: [child] };
    if (marker) child = highlightedNode(marker, [child]);
    const leading = text.slice(0, text.length - text.trimStart().length);
    const trailing = text.slice(text.trimEnd().length);
    if (leading) actions.appendToParent(mdastParent, { type: "text", value: leading });
    actions.appendToParent(mdastParent, child);
    if (trailing) actions.appendToParent(mdastParent, { type: "text", value: trailing });
  },
};

const importHighlight: MdastImportVisitor<TextDirective> = {
  ...highlightImportVisitor,
  testNode: (node) => node.type === "textDirective" && node.name === "highlight",
};

const importHighlightedCode: typeof highlightCodeImportVisitor = {
  ...highlightCodeImportVisitor,
  visitNode(context) {
    if (highlightFromStyle(context.actions.getParentStyle())) highlightCodeImportVisitor.visitNode(context);
    else context.actions.nextVisitor();
  },
};

export const productDocFormattingPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addImportVisitor$]: [importAlignment, importColor, importUnderline, importHighlight, importHighlightedCode],
      [addExportVisitor$]: [exportAlignment, exportInlineFormatting],
      [addMdastExtension$]: { transforms: [normalizeMarkerLinks] },
      [addToMarkdownExtension$]: { unsafe: highlightToMarkdown().unsafe },
    });
  },
});
