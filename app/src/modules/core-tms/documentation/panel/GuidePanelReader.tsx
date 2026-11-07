"use client";

import { memo, useLayoutEffect, useState, type MouseEvent } from "react";
import { DocumentationReader } from "../../../core-falcon-public/documentation/PublicDocumentation";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useDocumentationCatalog } from "../access/useDocumentationCatalog";
import { documentationLink } from "../navigation/documentation-link";
import { DocumentationArticle } from "../presentation/article/DocumentationArticle";

export const GuidePanelReader = memo(function GuidePanelReader({ request }: { request: { article: string } }) {
  const { locale } = useTmsLocale();
  const { docArticles, docGroups, articleById } = useDocumentationCatalog();
  const [page, setPage] = useState<{ id: string; section?: string }>({ id: request.article });
  useLayoutEffect(() => { setPage({ id: request.article }); }, [request]);
  const link = (id: string, section?: string) => documentationLink(window.location.href, id, section);
  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !articleById.has(id)) return;
    event.preventDefault();
    setPage({ id, section });
  };
  const navigation = { link, navigate, navigateSection: navigate };

  return <DocumentationReader embedded panelLocation={page} catalog={{ articles: docArticles, groups: docGroups }}
    locale={locale} activeId={page.id} href={link} onNavigate={navigate}
    renderArticle={active => <DocumentationArticle article={active} navigation={navigation} contextual />} />;
});
