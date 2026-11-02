import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

const actions = '[role="menuitem"]:not(:disabled),[role="menuitemcheckbox"]:not(:disabled),button:not(:disabled),a[href],input:not(:disabled)';
const openedEvent = "falcon:rail-popup-opened";
const tokens = ["--sidebar-text", "--sidebar-soft", "--sidebar-strong", "--sidebar-muted", "--sidebar-menu-bg", "--sidebar-menu-hover",
  "--sidebar-menu-border", "--sidebar-menu-text", "--sidebar-menu-icon", "--sidebar-menu-muted", "--sidebar-menu-strong", "--sidebar-focus"];

export function useRailPopup() {
  const root = useRef<HTMLDivElement | null>(null), trigger = useRef<HTMLButtonElement | null>(null), panel = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false), [position, setPosition] = useState({ left: 0, top: 0 });
  const opened = useRef(false), keyboard = useRef(false);
  const instance = useRef({});
  const opening = useRef<ReturnType<typeof setTimeout> | null>(null), closing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = useCallback(() => {
    if (closing.current !== null) clearTimeout(closing.current);
    closing.current = null;
  }, []);
  const clearTimers = useCallback(() => {
    if (opening.current !== null) clearTimeout(opening.current);
    opening.current = null; cancelClose();
  }, [cancelClose]);
  const dismiss = useCallback(() => {
    clearTimers(); opened.current = false; keyboard.current = false; setOpen(false);
  }, [clearTimers]);
  const close = useCallback((restoreFocus = keyboard.current) => {
    dismiss(); if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }, [dismiss]);
  const show = useCallback((fromKeyboard: boolean) => {
    clearTimers(); keyboard.current = fromKeyboard;
    document.dispatchEvent(new CustomEvent(openedEvent, { detail: instance.current }));
    if (opened.current && fromKeyboard) panel.current?.querySelector<HTMLElement>(actions)?.focus({ preventScroll: true });
    opened.current = true; setOpen(true);
  }, [clearTimers]);
  const openHover = useCallback(() => {
    cancelClose();
    if (opened.current || opening.current !== null) return;
    opening.current = setTimeout(() => show(false), 140);
  }, [cancelClose, show]);
  const leave = useCallback(() => {
    if (opening.current !== null) clearTimeout(opening.current);
    opening.current = null; cancelClose();
    if (keyboard.current && (root.current?.contains(document.activeElement) || panel.current?.contains(document.activeElement))) return;
    if (opened.current) closing.current = setTimeout(dismiss, 180);
  }, [cancelClose, dismiss]);
  const openKeyboard = useCallback(() => show(true), [show]);
  const toggle = useCallback(() => { if (opened.current) dismiss(); else show(false); }, [dismiss, show]);
  const triggerKeyDown = useCallback((event: KeyboardEvent) => {
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); openKeyboard(); }
    else if (event.key === "Escape" && opened.current) { event.preventDefault(); event.stopPropagation(); close(); }
  }, [close, openKeyboard]);
  const panelKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); keyboard.current = true;
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>(actions) ?? []);
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus({ preventScroll: true });
  }, [close]);
  useEffect(() => {
    const otherOpened = (event: Event) => { if ((event as CustomEvent).detail !== instance.current) dismiss(); };
    document.addEventListener(openedEvent, otherOpened);
    return () => { clearTimers(); document.removeEventListener(openedEvent, otherOpened); };
  }, [clearTimers, dismiss]);
  useLayoutEffect(() => {
    const element = panel.current, button = trigger.current;
    if (!open || !element || !button) return;
    const style = getComputedStyle(button);
    for (const token of tokens) element.style.setProperty(token, style.getPropertyValue(token));
    element.style.fontFamily = style.fontFamily; element.style.colorScheme = style.colorScheme;
    const place = () => {
      const edge = 8, width = Math.max(0, Math.min(228, window.innerWidth - edge * 2));
      const maxHeight = Math.max(0, window.innerHeight - edge * 2);
      element.style.width = `${width}px`; element.style.maxHeight = `${maxHeight}px`;
      const anchor = button.getBoundingClientRect(), height = Math.min(element.getBoundingClientRect().height, maxHeight);
      setPosition({ left: Math.max(edge, Math.min(anchor.right + 8, window.innerWidth - width - edge)),
        top: Math.max(edge, Math.min(anchor.top, window.innerHeight - height - edge)) });
    };
    const outside = (event: Event) => {
      if (!root.current?.contains(event.target as Node) && !element.contains(event.target as Node)) dismiss();
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    };
    place();
    if (keyboard.current) element.querySelector<HTMLElement>(actions)?.focus({ preventScroll: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    observer?.observe(element); observer?.observe(button);
    window.addEventListener("resize", place); window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", outside); document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, dismiss, close]);
  return { root, trigger, panel, open, position, openHover, leave, cancelClose, toggle, openKeyboard, close, dismiss, triggerKeyDown, panelKeyDown };
}
