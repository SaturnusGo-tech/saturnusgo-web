import { useEffect, useRef } from "react";

export function nearConversationBottom(element: { scrollHeight: number; scrollTop: number; clientHeight: number }) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 70;
}
export function useConversationScroll(revision: unknown, contentKey: unknown, conversationId = 0) {
  const scroll = useRef<HTMLDivElement>(null), following = useRef(true);
  const follow = () => { if (following.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; };
  useEffect(() => { following.current = true; }, [conversationId]);
  useEffect(follow, [revision]);
  useEffect(() => {
    const element = scroll.current;
    if (!element?.firstElementChild || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(follow); observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [contentKey]);
  return { scroll, onScroll: () => { if (scroll.current) following.current = nearConversationBottom(scroll.current); } };
}
