import { useLayoutEffect, useRef, type RefObject } from "react";

/** Native top layer keeps the panel outside repository/drawer clipping, with inherited theme tokens. */
export function useFilterPopup(panel: RefObject<HTMLDivElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useLayoutEffect(() => {
    const element = panel.current;
    const trigger = element?.parentElement?.querySelector<HTMLButtonElement>("button");
    if (!element || !trigger) return;
    element.showPopover?.();
    const position = () => {
      const bounds = trigger.getBoundingClientRect();
      const edge = 12, gap = 8;
      const width = Math.min(520, innerWidth - edge * 2);
      const below = innerHeight - bounds.bottom - gap - edge;
      const above = bounds.top - gap - edge;
      const upwards = below < 280 && above > below;
      const constrained = Math.max(above, below) < 220;
      const available = constrained ? innerHeight - edge * 2 : Math.max(120, upwards ? above : below);
      element.style.width = `${width}px`;
      element.style.maxHeight = `${Math.min(480, available)}px`;
      element.style.left = `${Math.max(edge, Math.min(bounds.left - 180, innerWidth - width - edge))}px`;
      element.style.top = `${constrained ? edge : Math.max(edge, upwards ? bounds.top - gap - element.getBoundingClientRect().height : bounds.bottom + gap)}px`;
    };
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!element.contains(target) && !trigger.contains(target)) close.current();
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    element.querySelector<HTMLButtonElement>("[role='tab'][aria-selected='true']")?.focus({ preventScroll: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, [panel]);
}
