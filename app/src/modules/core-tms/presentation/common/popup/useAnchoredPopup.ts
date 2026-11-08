import { useLayoutEffect, type RefObject } from "react";

type PopupAnchor = Pick<HTMLElement, "getBoundingClientRect" | "contains">;

export function useAnchoredPopup(open: boolean, inline: boolean, root: RefObject<HTMLDivElement | null>,
  trigger: RefObject<PopupAnchor | null>, menu: RefObject<HTMLDivElement | null>, onClose: () => void, preferredWidth = 0, maximumHeight = 320) {
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
      const available = Math.min(maximumHeight, Math.max(48, upwards ? above : below));
      element.dataset.popupSide = upwards ? "top" : "bottom";
      element.style.width = `${width}px`;
      element.style.maxHeight = `${available}px`;
      element.style.left = `${Math.max(edge, Math.min(bounds.left, innerWidth - width - edge))}px`;
      element.style.top = `${Math.max(edge, upwards ? bounds.top - gap - Math.min(element.scrollHeight, available) : bounds.bottom + gap)}px`;
    };
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !trigger.current?.contains(target)) onClose();
    };
    const content = element.firstElementChild;
    const observer = content && typeof ResizeObserver !== "undefined" ? new ResizeObserver(position) : null;
    if (content) observer?.observe(content);
    position(); window.addEventListener("resize", position); window.addEventListener("scroll", position, true);
    document.addEventListener("pointerdown", outside, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true);
      document.removeEventListener("pointerdown", outside, true);
      hideNativePopover(element);
    };
  }, [open, inline, root, trigger, menu, onClose, preferredWidth, maximumHeight]);
}

/** Older engines treat the popover attribute as an ordinary fixed-position panel. */
export function hideNativePopover(element: HTMLElement) {
  if (typeof element.hidePopover === "function" && element.matches(":popover-open")) element.hidePopover();
}
