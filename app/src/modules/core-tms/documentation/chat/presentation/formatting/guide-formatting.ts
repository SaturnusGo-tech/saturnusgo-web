import type { Nodes, Root, RootContent } from "mdast";
import type { PluggableList } from "unified";
import remarkGfm from "remark-gfm";
import { remarkHighlightSyntax, remarkHighlights } from "../../../../presentation/cases/inspector/markdown/highlight/render/remarkHighlights";
import { highlightColorOf } from "../../../../presentation/cases/inspector/markdown/highlight/model/highlightSyntax";

type Parent = { children: RootContent[] };
function textOf(node: Nodes): string {
  return "value" in node ? String(node.value) : "children" in node ? node.children.map(textOf).join("") : "";
}

/** Restrict assistant emphasis without changing the shared case editor's marker vocabulary. */
function remarkGuideFormatting({ streaming }: { streaming: boolean }) {
  return (tree: Root, file: { value: unknown }) => {
    let markers = 0;
    const length = String(file.value).length;
    function visit(parent: Parent, heading = false, insideMarker = false) {
      const result: RootContent[] = [];
      for (let index = 0; index < parent.children.length; index++) {
        const node = parent.children[index];
        if (node.type === "textDirective" && node.name === "highlight") {
          const label = textOf(node);
          const allow = !heading && !insideMarker && highlightColorOf(node) === "yellow"
            && label.trim().length > 0 && label.length <= 80 && markers < 2;
          if (allow) markers++;
          visit(node as Parent, heading, true);
          // The directive parser emits a partial label/attribute tail as an adjacent text node.
          const next = parent.children[index + 1];
          if (streaming && next?.type === "text") {
            if (!node.children.length && next.value.startsWith("[")) next.value = next.value.slice(1);
            if (next.position?.end.offset === length && next.value.startsWith("{")) next.value = "";
          }
          result.push(...(allow ? [node] : node.children));
          continue;
        }
        if (streaming && node.type === "textDirective" && "highlight".startsWith(node.name)
          && node.position?.end.offset === length && !node.children.length) continue;
        if ("children" in node) visit(node as Parent, heading || node.type === "heading", insideMarker);
        result.push(node);
      }
      parent.children = result;
    }
    visit(tree);
  };
}

export function guideRemarkPlugins(streaming = false): PluggableList {
  return [remarkGfm, remarkHighlightSyntax, [remarkGuideFormatting, { streaming }], remarkHighlights];
}
