import type { Root } from "mdast";
import { readCaseReferenceMarker } from "../../../../case-references/domain/caseReference";
import { readProductDocSmartTarget } from "../../../navigation/product-doc-smart-link";
import type { ProductDocScope } from "../../../domain/product-docs";

type Node = { type: string; value?: string; url?: string; children?: Node[];
  data?: { hName?: string; hProperties?: Record<string, string> } };
type Options = { current?: string; scope?: ProductDocScope };
const formatting = new Set(["strong", "emphasis", "delete"]);
const sourceLabel = /^\s*(sources?|источники?|related cases|связанные (?:тест-)?кейсы)\s*:\s*/iu;

/** Reader projection only: neither the authored Markdown nor the editable document changes. */
export function remarkProductDocCaseGroups(options: Options = {}) {
  function reference(node: Node) {
    if (node.type !== "link" || !node.url) return false;
    return Boolean(readCaseReferenceMarker(node.url)) || Boolean(options.scope && options.current &&
      readProductDocSmartTarget(node.url, options.current, options.scope)?.kind === "case");
  }
  function group(children: Node[]) {
    const links: Node[] = [];
    let label = "", started = false;
    function collect(nodes: Node[]): boolean {
      return nodes.every(node => {
        if (reference(node)) { links.push(node); started = true; return true; }
        if (formatting.has(node.type) && node.children) return collect(node.children);
        if (node.type !== "text" && node.type !== "break") return false;
        let text = node.value ?? "";
        if (!started && !label) {
          const match = text.match(sourceLabel);
          if (match) { label = match[1]; text = text.slice(match[0].length); }
        }
        return /^[\s,;:.|·•–—-]*$/u.test(text);
      });
    }
    return collect(children) && links.length > 1 ? { type: "paragraph", children: links,
      data: { hName: "falcon-case-group", hProperties: { label } } } satisfies Node : null;
  }
  function visit(node: Node) {
    if (!node.children || ["link", "code", "inlineCode", "html", "heading"].includes(node.type)) return;
    if (node.type === "paragraph" || node.type === "tableCell") {
      const projected = group(node.children);
      if (projected) {
        if (node.type === "tableCell") node.children = [projected];
        else { node.children = projected.children; node.data = projected.data; }
        return;
      }
    }
    node.children.forEach(visit);
  }
  return (tree: Root) => visit(tree as unknown as Node);
}
