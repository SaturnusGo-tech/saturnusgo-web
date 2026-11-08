import type { ProductDocScope } from "../product-docs";

export type ProductDocEmbedScope = ProductDocScope & {
  docId: string;
  draft?: boolean;
  version?: number;
  archived?: boolean;
};

export function setProductDocEmbedRevision(query: URLSearchParams, { version, archived, draft }: ProductDocEmbedScope) {
  if (version !== undefined) query.set("version", String(version));
  else if (archived) query.set("archived", "true");
  else if (draft) query.set("draft", "true");
}
