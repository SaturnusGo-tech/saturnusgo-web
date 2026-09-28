import type { DocArticle } from "../../model/article";
import type { GuideCitation } from "./conversation";

export function visibleCitations(citations: readonly GuideCitation[], articles: ReadonlyMap<string, DocArticle>) {
  const seen = new Set<string>();
  return citations.flatMap(citation => {
    const article = articles.get(citation.articleId);
    const section = article?.sections.find(item => item.id === citation.sectionId);
    const key = `${citation.articleId}:${citation.sectionId}`;
    if (!article || !section || seen.has(key)) return [];
    seen.add(key);
    // Display trusted guide titles, not model-provided markup or link labels.
    return [{ ...citation, title: article.title, sectionTitle: section.title }];
  });
}
