import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { HISTORY_CHANGE } from "../../../../state/navigation/browser/workspace-history";
import workspace from "../../../../tms.module.css";

/** A workspace page that preserves the originating run/case tree until it is dismissed. */
export function DefectPageHost({ children, onNavigate, pending }: { children: ReactNode; onNavigate: () => void; pending: boolean }) {
  const anchor = useRef<HTMLSpanElement>(null), navigate = useRef(onNavigate);
  const [host, setHost] = useState<HTMLElement | null>(null);
  navigate.current = onNavigate;
  useLayoutEffect(() => {
    const app = anchor.current?.closest(`.${workspace.app}`);
    const target = app?.querySelector<HTMLElement>("[data-workspace-content]");
    if (!target) return;
    const href = window.location.href;
    const origin = document.activeElement as HTMLElement | null;
    const position = target.style.position;
    if (getComputedStyle(target).position === "static") target.style.position = "relative";
    const siblings = [...target.children].filter((node): node is HTMLElement => node instanceof HTMLElement);
    const dock = app?.querySelector<HTMLElement>("[data-verification-dock]");
    const dockDisplay = dock?.style.getPropertyValue("display"), dockPriority = dock?.style.getPropertyPriority("display");
    const state = [...siblings, ...(dock ? [dock] : [])].map(node => ({ node, inert: node.inert, hidden: node.getAttribute("aria-hidden") }));
    for (const { node } of state) { node.inert = true; node.setAttribute("aria-hidden", "true"); }
    dock?.style.setProperty("display", "none", "important");
    setHost(target);
    return () => {
      target.style.position = position;
      if (dock) {
        if (dockDisplay) dock.style.setProperty("display", dockDisplay, dockPriority); else dock.style.removeProperty("display");
      }
      for (const { node, inert, hidden } of state) {
        node.inert = inert;
        if (hidden === null) node.removeAttribute("aria-hidden"); else node.setAttribute("aria-hidden", hidden);
      }
      if (window.location.href === href && origin?.isConnected && !origin.closest('[inert],[aria-hidden="true"]')) origin.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (!host) return;
    const href = window.location.href;
    const leave = () => { if (window.location.href !== href) navigate.current(); };
    window.addEventListener(HISTORY_CHANGE, leave);
    return () => window.removeEventListener(HISTORY_CHANGE, leave);
  }, [host]);
  useEffect(() => {
    if (!host || !pending) return;
    const app = host.closest(`.${workspace.app}`);
    const navigation = app?.querySelector<HTMLElement>("#tms-navigation");
    const header = host.closest("main")?.parentElement?.querySelector<HTMLElement>(":scope > header");
    const items = [navigation, header].filter((node): node is HTMLElement => Boolean(node));
    const prior = items.map(node => node.inert);
    items.forEach(node => { node.inert = true; });
    return () => items.forEach((node, index) => { node.inert = prior[index]; });
  }, [host, pending]);
  return <><span ref={anchor} hidden />{host && createPortal(children, host)}</>;
}
