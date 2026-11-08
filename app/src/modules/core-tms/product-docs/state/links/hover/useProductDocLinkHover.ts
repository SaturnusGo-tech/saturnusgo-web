import { useCallback, useEffect, useRef, useState } from "react";

export function useProductDocLinkHover() {
  const [anchor, setAnchor] = useState<HTMLAnchorElement | null>(null);
  const trigger = useRef<HTMLAnchorElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retain = useCallback(() => clearTimeout(timer.current), []);
  const close = useCallback(() => {
    retain();
    trigger.current = null;
    setAnchor(null);
  }, [retain]);
  const show = useCallback((element: HTMLAnchorElement, delay = 170) => {
    retain();
    if (trigger.current === element) return;
    function open() {
      if (!element.isConnected) return;
      trigger.current = element;
      setAnchor(element);
    }
    if (delay) timer.current = setTimeout(open, delay);
    else open();
  }, [retain]);
  const hide = useCallback((element: HTMLAnchorElement | null = trigger.current) => {
    retain();
    timer.current = setTimeout(() => {
      if (element?.matches(":focus-visible")) return;
      close();
    }, 110);
  }, [close, retain]);
  useEffect(() => retain, [retain]);
  useEffect(() => {
    if (!anchor) return;
    function dismiss(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close();
    }
    window.addEventListener("keydown", dismiss, true);
    return () => window.removeEventListener("keydown", dismiss, true);
  }, [anchor, close]);
  return { anchor, trigger, retain, show, hide, close };
}
