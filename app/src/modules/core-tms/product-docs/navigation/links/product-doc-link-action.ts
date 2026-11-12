import type { ProductDocSmartTarget } from "../product-doc-smart-link";

export function productDocLinkAction(kind: ProductDocSmartTarget["kind"] | undefined, ru: boolean) {
  if (kind === "case") return ru ? "Открыть тест-кейс" : "Open case";
  if (kind === "document") return ru ? "Открыть документ" : "Open document";
  if (kind === "repository") return ru ? "Открыть репозиторий" : "Open repository";
  if (kind === "external") return ru ? "Открыть внешнюю ссылку" : "Open external link";
  return ru ? "Открыть ссылку" : "Open link";
}
