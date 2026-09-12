import { $getSelection, $isElementNode, $isRangeSelection, $isRootOrShadowRoot, $isTextNode, $splitNode,
  type ElementNode, type LexicalNode } from "lexical";

/** Block replies must not change the unselected heading/paragraph on either side of a range. */
export function insertPartialBlocks(nodes: LexicalNode[]): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed() || !nodes.length) return false;
  let block: LexicalNode | null = selection.anchor.getNode();
  while (block && (!$isElementNode(block) || block.isInline())) block = block.getParent();
  if (!$isElementNode(block) || !$isRootOrShadowRoot(block.getParent())
    || !["heading", "paragraph", "quote"].includes(block.getType())) return false;

  selection.removeText();
  const point = selection.anchor, node = point.getNode();
  let parent: ElementNode, offset: number;
  if ($isTextNode(node)) {
    parent = node.getParentOrThrow();
    if (point.offset > 0 && point.offset < node.getTextContentSize()) {
      offset = node.splitText(point.offset)[1].getIndexWithinParent();
    } else offset = node.getIndexWithinParent() + (point.offset > 0 ? 1 : 0);
  } else {
    // RangeSelection element points always reference an ElementNode.
    parent = node as ElementNode; offset = point.offset;
  }
  const [before, after] = $splitNode(parent, offset);
  after.getParentOrThrow().splice(after.getIndexWithinParent(), 0, nodes);
  if (before?.isEmpty()) before.remove();
  if (after.isEmpty()) after.remove();
  nodes[nodes.length - 1].selectEnd();
  return true;
}
