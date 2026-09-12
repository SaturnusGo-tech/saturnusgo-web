import type { Root, RootContent, Text } from "mdast";
import { decodeString } from "micromark-util-decode-string";
import { highlightColorOf } from "../model/highlightSyntax";

/** Older exports could let GFM create an invalid nested autolink inside a marked link label.
 * Unwrap that nested link and decode its label's Markdown escapes; never change the outer href.
 */
export function normalizeMarkerLinks(tree: Root) {
  function visit(parent: { children: RootContent[] }, inLink: boolean, inMarker: boolean) {
    parent.children = parent.children.flatMap((node): RootContent[] => {
      const marked = inMarker || Boolean(highlightColorOf(node));
      if (node.type === "link" && inLink && marked) {
        return node.children.map((child) => child.type === "text"
          ? { ...child, value: decodeString(child.value) } satisfies Text : child);
      }
      if ("children" in node) visit(node as { children: RootContent[] }, inLink || node.type === "link", marked);
      return [node];
    });
  }
  visit(tree, false, false);
}
