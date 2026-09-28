import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

type Popup = { kind: "context" | "sections"; x: number; y: number };

export function useSidebarSectionsPopup(sidebar: RefObject<HTMLElement | null>) {
  const [popup, setPopup] = useState<Popup | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const dismiss = useCallback(() => setPopup(null), []);
  const close = useCallback(() => {
    setPopup(null);
    const target = origin.current;
    (target?.isConnected ? target : sidebar.current)?.focus({ preventScroll: true });
  }, [sidebar]);

  useEffect(() => {
    const navigation = sidebar.current;
    if (!navigation) return;
    const open = (event: MouseEvent | KeyboardEvent) => {
      if (root.current?.contains(event.target as Node)) return;
      event.preventDefault();
      const target = event.target as HTMLElement;
      origin.current = target.closest<HTMLElement>("button, a, [tabindex]") ?? navigation;
      const keyboard = event.type === "keydown" || ((event as MouseEvent).clientX === 0 && (event as MouseEvent).clientY === 0);
      const bounds = origin.current.getBoundingClientRect();
      setPopup({ kind: "context", x: keyboard ? bounds.left : (event as MouseEvent).clientX,
        y: keyboard ? bounds.bottom : (event as MouseEvent).clientY });
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) open(event);
    };
    navigation.addEventListener("contextmenu", open);
    navigation.addEventListener("keydown", keyboard);
    return () => {
      navigation.removeEventListener("contextmenu", open);
      navigation.removeEventListener("keydown", keyboard);
    };
  }, [sidebar]);

  useLayoutEffect(() => {
    const element = panel.current;
    if (!popup || !element) return;
    element.showPopover?.();
    const position = () => {
      const edge = 12;
      const width = Math.min(popup.kind === "context" ? 200 : 300, Math.max(0, innerWidth - edge * 2));
      element.style.width = `${width}px`;
      element.style.maxHeight = `${Math.max(0, Math.min(320, innerHeight - edge * 2))}px`;
      element.style.left = `${Math.max(edge, Math.min(popup.x, innerWidth - width - edge))}px`;
      element.style.top = `${Math.max(edge, Math.min(popup.y, innerHeight - element.getBoundingClientRect().height - edge))}px`;
    };
    position();
    element.querySelector<HTMLElement>(popup.kind === "context" ? "[role=menuitem]" : "input:checked")?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) dismiss(); };
    const scroll = (event: Event) => { if (!root.current?.contains(event.target as Node)) dismiss(); };
    window.addEventListener("resize", position);
    window.addEventListener("scroll", scroll, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", scroll, true);
      document.removeEventListener("pointerdown", outside);
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, [popup, dismiss]);

  return { popup, root, panel, close, dismiss,
    openSections: () => setPopup(current => current && { ...current, kind: "sections" }) };
}
