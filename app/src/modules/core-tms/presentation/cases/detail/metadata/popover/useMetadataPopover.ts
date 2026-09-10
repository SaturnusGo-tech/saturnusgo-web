import { useLayoutEffect, type RefObject } from "react";
export function useMetadataPopover(open: boolean, trigger: RefObject<HTMLButtonElement | null>, menu: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const element = menu.current;
    if (!element || !element.showPopover) return;
    if (!open) { if (element.matches(":popover-open")) element.hidePopover(); return; }
    element.showPopover();
    const position = () => {
      const bounds = trigger.current?.getBoundingClientRect();
      if (!bounds) return;
      element.style.setProperty("--menu-width", `${Math.min(bounds.width, innerWidth - 24)}px`);
      const width = element.offsetWidth;
      const height = Math.min(element.scrollHeight + 2, 226, innerHeight - 24);
      const below = innerHeight - bounds.bottom - 12;
      const top = below < height && bounds.top > height + 12 ? bounds.top - height - 4 : bounds.bottom + 4;
      element.style.setProperty("--menu-left", `${Math.max(12, Math.min(bounds.left, innerWidth - width - 12))}px`);
      element.style.setProperty("--menu-top", `${Math.max(12, Math.min(top, innerHeight - height - 12))}px`);
      element.style.maxHeight = `${Math.min(226, innerHeight - 24)}px`;
    };
    position(); window.addEventListener("resize", position); window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true);
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, [open, trigger, menu]);
}
