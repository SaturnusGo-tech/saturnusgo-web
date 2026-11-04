"use client";
import { useEffect, useRef } from "react";
import { DocumentationReader } from "../../../core-falcon-public/documentation/PublicDocumentation";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useDocumentationCopy } from "../localization/useDocumentationCopy";
import { useDocumentationCatalog } from "../access/useDocumentationCatalog";
import { useDocumentationNavigation } from "../navigation/useDocumentationNavigation";
import { DocumentationArticle, DocumentationArticleSections } from "./article/DocumentationArticle";
import { ArticleBlocks } from "./content/ArticleBlocks";
import { DocumentationHome } from "./home/DocumentationHome";
import { documentationChatId } from "../navigation/documentation-link";
import { useDocumentationChat } from "../chat/state/useDocumentationChat";
import { DocumentationChat } from "../chat/presentation/DocumentationChat";
import { DocumentationHeader } from "./header/DocumentationHeader";
import { useHistoryDisclosure } from "../chat/history/state/sidebar/useHistoryDisclosure";
import styles from "./documentation.module.css";

export function DocumentationView() {
  const copy = useDocumentationCopy();
  const catalog = useDocumentationCatalog();
  const { setLocale } = useTmsLocale();
  const chat = useDocumentationChat();
  const navigation = useDocumentationNavigation(chat.owner);
  const rootRef = useRef<HTMLElement>(null);
  const history = useHistoryDisclosure(rootRef);
  const chatting = navigation.articleId === documentationChatId;
  const appUrl = new URL(navigation.link("introduction"), "https://falcon.invalid");
  appUrl.searchParams.set("view", "cases"); appUrl.searchParams.delete("article");
  appUrl.hash = "";

  useEffect(() => {
    if (!chatting) return;
    const shortcut = (event: KeyboardEvent) => { if (event.key === "Escape" && history.open) history.close(true); };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [chatting, history.open]);

  return <section ref={rootRef} className={styles.root} data-documentation-workspace data-chatting={chatting}
    lang={catalog.locale} aria-label={copy.workspace}>
    {chatting ? <>
      <DocumentationHeader navigation={navigation} chatting treeOpen={false} historyOpen={history.open}
        onTreeToggle={history.toggle} onNavigate={() => {}} onSearch={() => {}} />
      <DocumentationChat chat={chat} navigation={navigation} onSource={() => {}} history={history} />
    </> : <DocumentationReader embedded catalog={{ articles: catalog.docArticles, groups: catalog.docGroups }}
      locale={catalog.locale} activeId={navigation.articleId} href={navigation.link} onNavigate={navigation.navigate}
      onLocaleChange={setLocale} appHref={`${appUrl.pathname}${appUrl.search}`}
      aiHref={navigation.link(documentationChatId)} onAskAI={event => navigation.navigate(event, documentationChatId)}
      renderArticle={article => <DocumentationArticle article={article} navigation={navigation} />}
      renderHome={() => <DocumentationHome catalog={catalog} href={navigation.link} onNavigate={navigation.navigate}
        renderIntroduction={article => <DocumentationArticleSections article={article} navigation={navigation}
          sectionLinkLabel={copy.sectionLink} renderBlocks={blocks => <ArticleBlocks blocks={blocks} navigation={navigation} />} />} />} />}
  </section>;
}
