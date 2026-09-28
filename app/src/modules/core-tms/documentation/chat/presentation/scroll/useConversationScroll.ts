import { useEffect, useLayoutEffect, useRef } from "react";

export function nearConversationBottom(element: { scrollHeight: number; scrollTop: number; clientHeight: number }) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 70;
}
export function useConversationScroll(revision: unknown, contentKey: unknown, conversationId: string | number = 0, targetId?: string | null) {
  const scroll = useRef<HTMLDivElement>(null), following = useRef(!targetId), focused = useRef("");
  const follow = () => { if (following.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; };
  useLayoutEffect(() => { following.current = !targetId; focused.current = ""; }, [conversationId, targetId]);
  useLayoutEffect(() => {
    if (!targetId || focused.current === `${conversationId}:${targetId}` || !scroll.current) return;
    const target = scroll.current.querySelector<HTMLElement>(`[data-guide-message="${targetId}"]`);
    if (!target) return;
    scroll.current.scrollTop += target.getBoundingClientRect().top - scroll.current.getBoundingClientRect().top - 16;
    target.focus({ preventScroll: true }); following.current = false; focused.current = `${conversationId}:${targetId}`;
  }, [targetId, contentKey, conversationId]);
  useEffect(follow, [revision]);
  useEffect(() => {
    const element = scroll.current;
    if (!element?.firstElementChild || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(follow); observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [contentKey]);
  return { scroll, onScroll: () => { if (scroll.current) following.current = nearConversationBottom(scroll.current); } };
}
