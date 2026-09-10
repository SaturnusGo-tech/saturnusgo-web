import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
export type CommentBranch = { comment: TestCaseComment; children: CommentBranch[] };
export function commentTree(items: readonly TestCaseComment[]): CommentBranch[] {
  const nodes = new Map(items.map(comment => [comment.id, { comment, children: [] } as CommentBranch]));
  const roots: CommentBranch[] = [];
  for (const node of nodes.values()) {
    const parent = node.comment.parentId ? nodes.get(node.comment.parentId) : undefined;
    const visited = new Set([node.comment.id]);
    let ancestor = parent; let cycle = false;
    while (ancestor) {
      if (visited.has(ancestor.comment.id)) { cycle = true; break; }
      visited.add(ancestor.comment.id);
      ancestor = ancestor.comment.parentId ? nodes.get(ancestor.comment.parentId) : undefined;
    }
    if (parent && !cycle) parent.children.push(node); else roots.push(node);
  }
  const chronological = (a: CommentBranch, b: CommentBranch) => a.comment.createdAt.localeCompare(b.comment.createdAt) || a.comment.id.localeCompare(b.comment.id);
  for (const node of nodes.values()) node.children.sort(chronological);
  return roots.sort((a,b) => -chronological(a,b));
}
