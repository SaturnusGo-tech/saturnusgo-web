import { useCallback, useEffect, useRef, useState } from "react";

export function useProductDocLinkHover() {
  const [anchor, setAnchor] = useState<HTMLAnchorElement | null>(null);
  const trigger = useRef<HTMLAnchorElement | null>(null);
  const pending = useRef<{ element: HTMLAnchorElement; timer: ReturnType<typeof setTimeout> } | null>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retain = useCallback(() => clearTimeout(closing.current), []);
  const cancelOpening = useCallback(() => {
    clearTimeout(pending.current?.timer);
    pending.current = null;
  }, []);
  const close = useCallback(() => {
    retain();
    cancelOpening();
    trigger.current = null;
    setAnchor(null);
  }, [cancelOpening, retain]);
  const show = useCallback((element: HTMLAnchorElement, delay = 170) => {
    cancelOpening();
    if (trigger.current === element) {
      retain();
      return;
    }
    function open() {
      pending.current = null;
      if (!element.isConnected) return;
      retain();
      trigger.current = element;
      setAnchor(element);
    }
    if (delay) pending.current = { element, timer: setTimeout(open, delay) };
    else open();
  }, [cancelOpening, retain]);
  const hide = useCallback((element: HTMLAnchorElement | null = trigger.current) => {
    if (pending.current?.element === element) cancelOpening();
    if (!element || trigger.current !== element) return;
    retain();
    closing.current = setTimeout(() => {
      if (trigger.current !== element || element.matches(":focus-visible")) return;
      trigger.current = null;
      setAnchor(null);
    }, 110);
  }, [cancelOpening, retain]);
  useEffect(() => () => { retain(); cancelOpening(); }, [cancelOpening, retain]);
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
