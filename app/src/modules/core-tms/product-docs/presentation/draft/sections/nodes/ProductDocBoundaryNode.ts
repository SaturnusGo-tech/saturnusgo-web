import { $applyNodeReplacement, $setState, DecoratorNode, type SerializedLexicalNode } from "lexical";
import { sectionIdState } from "./sectionNodeState";

/** A hidden boundary preserves existing links to body sections with no heading. */
export class ProductDocBoundaryNode extends DecoratorNode<null> {
  static getType() { return "product-doc-section-boundary"; }

  static clone(node: ProductDocBoundaryNode) { return new ProductDocBoundaryNode(node.getKey()); }

  static importJSON(serialized: SerializedLexicalNode) {
    return $applyNodeReplacement(new ProductDocBoundaryNode()).updateFromJSON(serialized);
  }

  createDOM() {
    const marker = document.createElement("span");
    marker.hidden = true;
    marker.setAttribute("aria-hidden", "true");
    return marker;
  }

  updateDOM() { return false; }
  decorate() { return null; }
  isInline() { return false; }
  isKeyboardSelectable() { return false; }
}

export function $createProductDocBoundaryNode(id: string) {
  return $setState($applyNodeReplacement(new ProductDocBoundaryNode()), sectionIdState, id);
}
