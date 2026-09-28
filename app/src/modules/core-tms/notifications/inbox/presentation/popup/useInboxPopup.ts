import { useCallback, useLayoutEffect, useRef, useState } from "react";

export function useInboxPopup() {
  const [open, setOpen] = useState(false);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  const close = useCallback(() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }, []);
  useLayoutEffect(() => {
    const element = panel.current, button = trigger.current;
    if (!open || !element || !button) return;
    if (typeof element.showPopover !== 'function' && !portalHost) {
      setPortalHost(button.closest<HTMLElement>('[data-testid="tms-workspace"]') ?? document.body);
      return;
    }
    if (!portalHost) element.showPopover();
    const position = () => {
      if (portalHost === document.body) {
        const theme = getComputedStyle(button);
        for (const token of ['--line', '--surface', '--ink', '--muted', '--ink-soft', '--glass-hover']) {
          element.style.setProperty(token, theme.getPropertyValue(token));
        }
        element.style.fontFamily = theme.fontFamily; element.style.fontSize = theme.fontSize;
        element.style.lineHeight = theme.lineHeight; element.style.colorScheme = theme.colorScheme;
      }
      const anchor = button.getBoundingClientRect();
      const sidebar = button.closest('nav')?.getBoundingClientRect();
      const edge = 10, width = Math.max(0, Math.min(456, innerWidth - edge * 2)), height = Math.max(0, Math.min(680, innerHeight - edge * 2));
      const left = innerWidth > 760 ? Math.min((sidebar?.right ?? anchor.right) + 10, innerWidth - width - edge) : edge;
      element.style.width = `${width}px`; element.style.height = `${height}px`;
      element.style.left = `${Math.max(edge, left)}px`;
      element.style.top = `${Math.max(edge, Math.min(anchor.bottom - height, innerHeight - height - edge))}px`;
    };
    const outside = (event: Event) => {
      if (!root.current?.contains(event.target as Node) && !element.contains(event.target as Node)) dismiss();
    };
    // The sidebar listens natively; stop here before React's delegated event reaches that ancestor.
    const contextMenu = (event: Event) => event.stopPropagation();
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } };
    position(); element.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    const observer = new ResizeObserver(position); if (button.closest('nav')) observer.observe(button.closest('nav')!);
    window.addEventListener('resize', position); window.addEventListener('scroll', position, true);
    document.addEventListener('pointerdown', outside); document.addEventListener('focusin', outside);
    element.addEventListener('keydown', keyboard);
    element.addEventListener('contextmenu', contextMenu);
    return () => {
      observer.disconnect(); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true);
      document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside);
      element.removeEventListener('keydown', keyboard);
      element.removeEventListener('contextmenu', contextMenu);
      if (!portalHost && element.matches(':popover-open')) element.hidePopover();
    };
  }, [open, close, dismiss, portalHost]);
  return { root, trigger, panel, open, portalHost, toggle: () => setOpen(value => !value), close, dismiss };
}
