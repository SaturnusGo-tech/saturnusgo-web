import { $applyNodeReplacement, ElementNode, type NodeKey, type SerializedElementNode } from "lexical";
import type { LayoutRatio } from "../productDocLayoutBlocks";

type SerializedLayout = SerializedElementNode & { ratio?: LayoutRatio };

export class ProductDocLayoutNode extends ElementNode {
  __ratio: LayoutRatio;

  constructor(ratio: LayoutRatio = "even", key?: NodeKey) {
    super(key);
    this.__ratio = ratio;
  }

  static getType() { return "product-doc-layout"; }

  static clone(node: ProductDocLayoutNode) { return new ProductDocLayoutNode(node.__ratio, node.getKey()); }

  static importJSON(serialized: SerializedLayout) {
    return $createProductDocLayoutNode(serialized.ratio).updateFromJSON(serialized);
  }

  exportJSON(): SerializedLayout {
    return { ...super.exportJSON(), ratio: this.getRatio() };
  }

  createDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-doc-columns", "");
    element.dataset.docLayoutRatio = this.getRatio();
    return element;
  }

  updateDOM(_previous: ProductDocLayoutNode, element: HTMLElement) {
    element.dataset.docLayoutRatio = this.getRatio();
    return false;
  }

  getRatio() { return this.getLatest().__ratio; }

  setRatio(ratio: LayoutRatio) { this.getWritable().__ratio = ratio; }

  isShadowRoot() { return true; }
}

export class ProductDocColumnNode extends ElementNode {
  static getType() { return "product-doc-column"; }

  static clone(node: ProductDocColumnNode) { return new ProductDocColumnNode(node.getKey()); }

  static importJSON(serialized: SerializedElementNode) {
    return $createProductDocColumnNode().updateFromJSON(serialized);
  }

  createDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-doc-column", "");
    return element;
  }

  updateDOM() { return false; }
  isShadowRoot() { return true; }
}

export function $createProductDocLayoutNode(ratio?: LayoutRatio) {
  return $applyNodeReplacement(new ProductDocLayoutNode(ratio));
}

export function $createProductDocColumnNode() {
  return $applyNodeReplacement(new ProductDocColumnNode());
}
