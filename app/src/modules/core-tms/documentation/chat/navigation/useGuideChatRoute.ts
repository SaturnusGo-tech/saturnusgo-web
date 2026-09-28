import { useCallback, useEffect, useRef, useState } from "react";
import { HISTORY_CHANGE, navigateWorkspace } from "../../../state/navigation/browser/workspace-history";
import { guideChatLink, readGuideChatRoute, type GuideChatRoute } from "./chat-link";

export function useGuideChatRoute(identity = "") {
  const workspace = useRef<string | null>(null);
  const [route, setRoute] = useState<GuideChatRoute>({ chatId: null, turnId: null, shareId: null });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setRoute({ chatId: null, turnId: null, shareId: null });
    const read = () => {
      const url = new URL(window.location.href);
      const nextWorkspace = url.searchParams.get("workspaceId");
      if (workspace.current !== nextWorkspace) { workspace.current = nextWorkspace; setRoute(readGuideChatRoute(url.href)); }
      if (!url.searchParams.get("article") || url.searchParams.get("article") === "falcon-ai-chat") setRoute(readGuideChatRoute(url.href));
      setReady(true);
    };
    read(); window.addEventListener("popstate", read); window.addEventListener(HISTORY_CHANGE, read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener(HISTORY_CHANGE, read); };
  }, [identity]);
  const open = useCallback((next: Partial<GuideChatRoute>, replace = false) => {
    navigateWorkspace(guideChatLink(window.location.href, next), replace);
  }, []);
  return { ...route, ready, open };
}
