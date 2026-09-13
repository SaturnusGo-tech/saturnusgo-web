import { useLayoutEffect, type RefObject } from "react";

export function useAnchoredPopup(open: boolean, inline: boolean, root: RefObject<HTMLDivElement | null>,
  trigger: RefObject<HTMLButtonElement | null>, menu: RefObject<HTMLDivElement | null>, onClose: () => void, preferredWidth = 0) {
  useLayoutEffect(() => {
    const element = menu.current;
    if (!open || inline || !element) return;
    element.showPopover?.();
    const position = () => {
      const bounds = trigger.current?.getBoundingClientRect();
      if (!bounds) return;
      const gap = 6; const edge = 12;
      const width = Math.min(Math.max(bounds.width, preferredWidth), innerWidth - edge * 2);
      const below = innerHeight - bounds.bottom - gap - edge;
      const above = bounds.top - gap - edge;
      const upwards = below < Math.min(element.scrollHeight, 220) && above > below;
      const available = Math.min(320, Math.max(48, upwards ? above : below));
      element.style.width = `${width}px`;
      element.style.maxHeight = `${available}px`;
      element.style.left = `${Math.max(edge, Math.min(bounds.left, innerWidth - width - edge))}px`;
      element.style.top = `${Math.max(edge, upwards ? bounds.top - gap - Math.min(element.scrollHeight, available) : bounds.bottom + gap)}px`;
    };
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) onClose(); };
    position(); window.addEventListener("resize", position); window.addEventListener("scroll", position, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true);
      document.removeEventListener("pointerdown", outside);
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, [open, inline, root, trigger, menu, onClose, preferredWidth]);
}
