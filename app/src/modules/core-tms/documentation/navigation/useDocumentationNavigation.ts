import { transitionContent } from "../../presentation/workspace/motion/transition/content-transition";
import { HISTORY_CHANGE, navigateWorkspace } from "../../state/navigation/browser/workspace-history";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { defaultArticleId, documentationChatId, documentationLink, safeArticleId } from "./documentation-link";
import { guideChatLink, readGuideChatRoute, type GuideChatRoute } from "../chat/navigation/chat-link";

export function useDocumentationNavigation(identity = "") {
  const [articleId, setArticleId] = useState(defaultArticleId);
  const [href, setHref] = useState("");
  const lastChat = useRef<Partial<GuideChatRoute>>({});
  const workspace = useRef<string | null>(null);
  useEffect(() => {
    lastChat.current = {};
    const read = () => {
      const current = window.location.href, id = safeArticleId(new URL(current).searchParams.get("article"));
      const nextWorkspace = new URL(current).searchParams.get("workspaceId");
      if (workspace.current !== nextWorkspace) { workspace.current = nextWorkspace; lastChat.current = {}; }
      setHref(current); setArticleId(id);
      if (id === documentationChatId) lastChat.current = readGuideChatRoute(current);
    };
    read(); window.addEventListener("popstate", read); window.addEventListener("hashchange", read); window.addEventListener(HISTORY_CHANGE, read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener("hashchange", read); window.removeEventListener(HISTORY_CHANGE, read); };
  }, [identity]);
  const link = (id: string, section?: string) => href ? id === documentationChatId ? guideChatLink(href, lastChat.current)
    : documentationLink(href, id, section) : `?view=help&article=${id}`;
  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string, section?: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    transitionContent(() => {
    const next = id === documentationChatId ? guideChatLink(window.location.href, lastChat.current) : documentationLink(window.location.href, id, section);
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) navigateWorkspace(next);
    setHref(window.location.href); setArticleId(id);
    });
  };
  return { articleId, link, navigate };
}
