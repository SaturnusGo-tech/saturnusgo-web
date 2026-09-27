import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import css from "./navigationTooltip.module.css";

export function NavigationTooltip({ collapsed, root }: { collapsed: boolean; root: RefObject<HTMLElement | null> }) {
  const id = useId();
  const tip = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const nav = root.current, element = tip.current;
    if (!collapsed || !nav || !element) return;
    if (typeof element.showPopover !== "function" && !fallback) { setFallback(true); return; }
    let anchor: HTMLElement | null = null;
    let originalTitle: string | null = null;
    function hide() {
      if (anchor) {
        const descriptions = (anchor.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(value => value && value !== id);
        if (descriptions.length) anchor.setAttribute("aria-describedby", descriptions.join(" "));
        else anchor.removeAttribute("aria-describedby");
        if (originalTitle !== null && !anchor.hasAttribute("title")) anchor.setAttribute("title", originalTitle);
      }
      anchor = null; originalTitle = null;
      delete element!.dataset.open;
      if (!fallback && element!.matches(":popover-open")) element!.hidePopover();
    }
    function target(value: EventTarget | null) {
      const candidate = value instanceof Element ? value.closest<HTMLElement>("[data-nav-label]") : null;
      return candidate && nav!.contains(candidate) ? candidate : null;
    }
    function show(next: HTMLElement | null) {
      if (!next || window.innerWidth <= 760) { hide(); return; }
      if (anchor === next) return;
      const label = next.getAttribute("data-nav-label")?.trim() || next.getAttribute("aria-label")?.trim()
        || next.getAttribute("title")?.trim() || next.textContent?.trim();
      if (!label) { hide(); return; }
      hide(); anchor = next;
      originalTitle = next.getAttribute("title");
      if (originalTitle !== null) next.removeAttribute("title");
      element!.textContent = label;
      if (fallback) {
        const theme = getComputedStyle(nav!);
        const tokens = { "--tooltip-bg": "--sidebar-menu-bg", "--tooltip-text": "--sidebar-menu-text", "--tooltip-border": "--sidebar-menu-border" };
        for (const [property, source] of Object.entries(tokens)) element!.style.setProperty(property, theme.getPropertyValue(source));
        element!.style.fontFamily = theme.fontFamily;
      }
      element!.dataset.open = "true";
      if (!fallback) element!.showPopover();
      const bounds = next.getBoundingClientRect(), size = element!.getBoundingClientRect();
      const left = Math.min(Math.max(bounds.right, nav!.getBoundingClientRect().right) + 10, window.innerWidth - size.width - 8);
      const top = Math.min(bounds.top + (bounds.height - size.height) / 2, window.innerHeight - size.height - 8);
      element!.style.left = `${Math.max(8, left)}px`;
      element!.style.top = `${Math.max(8, top)}px`;
      const descriptions = (next.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
      next.setAttribute("aria-describedby", [...new Set([...descriptions, id])].join(" "));
    }
    const over = (event: PointerEvent) => { if (event.pointerType !== "touch") show(target(event.target)); };
    const out = (event: PointerEvent) => { if (anchor && !anchor.contains(event.relatedTarget as Node | null)) hide(); };
    const focus = (event: FocusEvent) => show(target(event.target));
    const blur = (event: FocusEvent) => { if (anchor && !anchor.contains(event.relatedTarget as Node | null)) hide(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") hide(); };
    nav.addEventListener("pointerover", over); nav.addEventListener("pointerout", out);
    nav.addEventListener("pointerleave", hide); nav.addEventListener("pointerdown", hide);
    nav.addEventListener("focusin", focus); nav.addEventListener("focusout", blur);
    window.addEventListener("keydown", escape); window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide); window.addEventListener("blur", hide);
    return () => {
      hide();
      nav.removeEventListener("pointerover", over); nav.removeEventListener("pointerout", out);
      nav.removeEventListener("pointerleave", hide); nav.removeEventListener("pointerdown", hide);
      nav.removeEventListener("focusin", focus); nav.removeEventListener("focusout", blur);
      window.removeEventListener("keydown", escape); window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide); window.removeEventListener("blur", hide);
    };
  }, [collapsed, root, fallback, id]);
  const content = <div ref={tip} id={id} role="tooltip" className={css.tooltip}
    popover={fallback ? undefined : "manual"} data-fallback={fallback || undefined}/>;
  return fallback ? createPortal(content, document.body) : content;
}
