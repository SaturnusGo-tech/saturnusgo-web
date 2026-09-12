import { useLayoutEffect, type RefObject } from "react";
export function useFolderPopup(open: boolean, inline: boolean, root: RefObject<HTMLDivElement | null>,
  trigger: RefObject<HTMLButtonElement | null>, menu: RefObject<HTMLDivElement | null>, onClose: () => void) {
  useLayoutEffect(() => {
    const element = menu.current;
    if (!open || inline || !element) return;
    if (element.showPopover) element.showPopover();
    const position = () => {
      const bounds = trigger.current?.getBoundingClientRect();
      if (!bounds) return;
      const width = Math.min(Math.max(bounds.width, 300), innerWidth - 24);
      element.style.width = `${width}px`;
      element.style.left = `${Math.max(12, Math.min(bounds.left, innerWidth - width - 12))}px`;
      element.style.top = `${bounds.bottom + 6}px`;
      element.style.maxHeight = `${Math.max(70, innerHeight - bounds.bottom - 18)}px`;
    };
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) onClose(); };
    position(); window.addEventListener("resize", position); window.addEventListener("scroll", position, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true);
      document.removeEventListener("pointerdown", outside);
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, [open, inline, root, trigger, menu, onClose]);
}
