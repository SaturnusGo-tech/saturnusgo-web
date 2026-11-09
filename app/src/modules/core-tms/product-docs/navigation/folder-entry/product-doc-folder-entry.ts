import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";

export interface ProductDocFolderEntry {
  node: ProductDocNode;
  caseId?: string;
}

export async function resolveProductDocFolderEntry(
  api: Pick<ProductDocsApi, "list" | "listArticleCases">,
  scope: ProductDocScope,
  folder: ProductDocNode,
  { draft, signal }: { draft?: boolean; signal?: AbortSignal } = {},
): Promise<ProductDocFolderEntry> {
  const parents = [folder.id];
  const seenNodes = new Set(parents);
  let nearestArticle: ProductDocNode | undefined;
  for (const parentId of parents) {
    const seenCursors = new Set<string>();
    let cursor: string | undefined;
    do {
      signal?.throwIfAborted();
      const page = await api.list(scope, { parentId, cursor, limit: 40, draft, signal });
      signal?.throwIfAborted();
      for (const node of page.nodes) {
        if (node.parentId !== parentId || node.archivedAt || seenNodes.has(node.id)) continue;
        seenNodes.add(node.id);
        parents.push(node.id);
        if (node.kind === "folder") continue;
        nearestArticle ??= node;
        if (node.publishedVersion === null) continue;
        const { cases } = await api.listArticleCases(scope, node.id, { limit: 1, signal });
        signal?.throwIfAborted();
        if (cases[0]) return { node, caseId: cases[0].caseId };
      }
      cursor = page.nextCursor ?? undefined;
      if (!cursor) break;
      if (seenCursors.has(cursor)) throw new Error("The documentation list repeated a cursor.");
      seenCursors.add(cursor);
    } while (cursor);
  }
  return { node: nearestArticle ?? folder };
}
