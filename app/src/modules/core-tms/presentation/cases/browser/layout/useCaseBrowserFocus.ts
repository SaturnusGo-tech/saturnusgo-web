import { useEffect, useRef, type FocusEvent, type RefObject } from "react";

export function useCaseBrowserFocus(enabled: boolean, open: boolean, fullscreen: boolean,
  workspace: RefObject<HTMLElement | null>, detail: RefObject<HTMLElement | null>) {
  const opener = useRef<HTMLElement | null>(null);
  const singlePane = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    let frame: number | null = null;
    function synchronize() {
      frame = null;
      const panel = detail.current;
      const tree = workspace.current?.querySelector<HTMLElement>("[data-repository-tree]");
      if (!panel || !tree) return;
      const treeVisible = Boolean(tree.getClientRects().length);
      const panelVisible = Boolean(panel.getClientRects().length);
      if (!treeVisible && !panelVisible) return;
      const next = open && panelVisible && !treeVisible;
      const active = document.activeElement;
      if (next && !singlePane.current && (active === document.body || tree.contains(active))) panel.focus();
      if (!open && singlePane.current && treeVisible && (active === document.body || panel.contains(active))) {
        const target = opener.current;
        if (target?.isConnected && target.getClientRects().length) target.focus();
        else tree.querySelector<HTMLElement>("button:not(:disabled)")?.focus();
      }
      singlePane.current = next;
    }
    function schedule() { if (frame !== null) cancelAnimationFrame(frame); frame = requestAnimationFrame(synchronize); }
    schedule();
    const observer = new ResizeObserver(schedule);
    if (workspace.current) observer.observe(workspace.current);
    return () => { observer.disconnect(); if (frame !== null) cancelAnimationFrame(frame); };
  }, [enabled, open, fullscreen, workspace, detail]);
  return (event: FocusEvent<HTMLElement>) => {
    if (event.target instanceof HTMLElement && workspace.current?.querySelector("[data-repository-tree]")?.contains(event.target)) opener.current = event.target;
  };
}
