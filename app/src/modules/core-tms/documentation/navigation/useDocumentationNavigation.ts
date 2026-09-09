import { transitionContent } from "../../presentation/workspace/motion/transition/content-transition";
import { navigateWorkspace } from "../../state/navigation/browser/workspace-history";
import { useEffect, useState, type MouseEvent } from "react";
import { defaultArticleId, documentationLink, safeArticleId } from "./documentation-link";

export function useDocumentationNavigation() {
  const [articleId, setArticleId] = useState(defaultArticleId);
  const [href, setHref] = useState("");
  useEffect(() => {
    const read = () => { setHref(window.location.href); setArticleId(safeArticleId(new URL(window.location.href).searchParams.get("article"))); };
    read(); window.addEventListener("popstate", read); window.addEventListener("hashchange", read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener("hashchange", read); };
  }, []);
  const link = (id: string, section?: string) => href ? documentationLink(href, id, section) : `?view=help&article=${id}`;
  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    transitionContent(() => {
    const next = documentationLink(window.location.href, id);
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) navigateWorkspace(next);
    setHref(window.location.href); setArticleId(id);
    });
  };
  return { articleId, link, navigate };
}
