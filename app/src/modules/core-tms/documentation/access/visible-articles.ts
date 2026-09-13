import type { DocArticle } from "../model/article";

export function visibleArticles(articles: readonly DocArticle[], administrator: boolean): readonly DocArticle[] {
  return articles.filter(article => !article.adminOnly || administrator);
}
