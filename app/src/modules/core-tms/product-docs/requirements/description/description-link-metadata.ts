import type { ProductDocDetail, ProductDocSelection } from "../../domain/product-docs";

export function productDocLinkMetadata(document: ProductDocDetail, selection: ProductDocSelection) {
  if (document.id !== selection.docId || document.kind !== "page" || document.version == null
    || (selection.version !== undefined && document.version !== selection.version)) return;
  const section = selection.sectionId ? document.sections.find(item => item.id === selection.sectionId) : undefined;
  if (selection.sectionId && !section) return;
  return {title: document.title, sectionTitle: section?.title, label: [document.title, section?.title].filter(Boolean).join(" · ")};
}
