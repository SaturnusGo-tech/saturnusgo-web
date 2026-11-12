import type { Root, RootContent } from "mdast";
import { caseReferenceMarker, findCaseKeys } from "../domain/caseReference";

const SKIP = new Set(["link", "linkReference", "inlineCode", "code", "html", "image", "imageReference", "definition"]);

/** Mark plain prose only; the renderer must authorize an exact real case before linking. */
export function remarkCaseReferences() {
  return (root: Root) => {
    function visit(parent: { children: RootContent[] }) {
      parent.children = parent.children.flatMap((node): RootContent[] => {
        if (SKIP.has(node.type)) return [node];
        if (node.type !== "text") {
          if ("children" in node) visit(node as unknown as { children: RootContent[] });
          return [node];
        }
        const matches = findCaseKeys(node.value);
        if (!matches.length) return [node];
        const output: RootContent[] = [];
        let offset = 0;
        for (const match of matches) {
          if (offset < match.start) output.push({ type: "text", value: node.value.slice(offset, match.start) });
          output.push({ type: "link", url: caseReferenceMarker(match.key), children: [
            { type: "text", value: node.value.slice(match.start, match.end) },
          ] });
          offset = match.end;
        }
        if (offset < node.value.length) output.push({ type: "text", value: node.value.slice(offset) });
        return output;
      });
    }
    visit(root);
  };
}
