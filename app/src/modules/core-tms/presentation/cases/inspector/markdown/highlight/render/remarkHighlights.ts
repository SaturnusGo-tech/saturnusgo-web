import type { Root, RootContent } from "mdast";
import type { Processor } from "unified";
import { directive } from "micromark-extension-directive";
import { directiveFromMarkdown } from "mdast-util-directive";
import type { Extension as SyntaxExtension } from "micromark-util-types";
import type { Extension as MdastExtension } from "mdast-util-from-markdown";
import { directiveLiteral, highlightColorOf } from "../model/highlightSyntax";

/** Only our exact color vocabulary reaches HTML; arbitrary directive attributes never do. */
export function remarkHighlights() {
  return (tree: Root) => {
    function childrenOf(parent: { children: RootContent[] }) {
      parent.children = parent.children.map((node) => {
        if (["textDirective", "leafDirective", "containerDirective"].includes(node.type)) {
          const color = highlightColorOf(node);
          if (!color) return { type: "text", value: directiveLiteral(node) };
          node.data = { hName: "mark", hProperties: { "data-marker": color } };
        }
        if ("children" in node) childrenOf(node as { children: RootContent[] });
        return node;
      });
    }
    childrenOf(tree);
  };
}

export function remarkHighlightSyntax(this: Processor) {
  const data = this.data() as { micromarkExtensions?: SyntaxExtension[]; fromMarkdownExtensions?: MdastExtension[] };
  (data.micromarkExtensions ??= []).push(directive());
  (data.fromMarkdownExtensions ??= []).push(directiveFromMarkdown());
}

export const highlightRemarkPlugins = [remarkHighlightSyntax, remarkHighlights];
