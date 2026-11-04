"use client";
import { useDocumentationCopy } from "../../localization/useDocumentationCopy";
import { useDocumentationCatalog } from "../../access/useDocumentationCatalog";
import type { DocArticle } from "../../model/article";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import { ArticleBlocks } from "../content/ArticleBlocks";
import { CopyButton } from "../controls/CopyButton";
import { DocumentationArticleContent } from "./DocumentationArticleContent";
export { DocumentationArticleContent, DocumentationArticleSections } from "./DocumentationArticleContent";

export function DocumentationArticle({ article, navigation }: {
  article: DocArticle; navigation: ReturnType<typeof useDocumentationNavigation>;
}) {
  const { docArticles, articleById, locale } = useDocumentationCatalog();
  const index = docArticles.findIndex(candidate => candidate.id === article.id);
  const copy = useDocumentationCopy();
  return <DocumentationArticleContent article={article} navigation={navigation} copy={copy} locale={locale}
    related={article.related.flatMap(id => { const related = articleById.get(id); return related ? [related] : []; })}
    previous={docArticles[index - 1]} next={docArticles[index + 1]}
    renderBlocks={blocks => <ArticleBlocks blocks={blocks} navigation={navigation} />}
    articleLink={<CopyButton value={() => new URL(navigation.link(article.id), window.location.origin).href} label={copy.articleLink} />} />;
}
