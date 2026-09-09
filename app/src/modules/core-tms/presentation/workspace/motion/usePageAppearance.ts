import { useEffect, useLayoutEffect, useRef } from "react";
import { HISTORY_CHANGE } from "../../../state/navigation/browser/workspace-history";

const destinations = ["view", "projectId", "caseId", "runId", "runItemId", "suiteId", "defectId", "portfolioId", "portfolioTab", "catalogProjectId", "projectTab", "organizationCreate", "organizationEdit", "article", "integration", "dashboardDetail"];
const locationKey = () => {
  const params = new URL(window.location.href).searchParams;
  return destinations.map((name) => params.get(name) ?? "").join(":");
};

/** Fallback and nested destinations: fade the committed content, never remount editors. */
export function usePageAppearance(view: string) {
  const ref = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  function reveal() {
      if (!ref.current?.animate || document.documentElement.dataset.falconTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      animation.current?.cancel();
      animation.current = ref.current.animate([{ opacity: .45 }, { opacity: 1 }], { duration: 220, easing: "cubic-bezier(.22,.68,.25,1)" });
  }
  useLayoutEffect(reveal, [view]);
  useEffect(() => {
    let previous = locationKey();
    const changed = () => { const next = locationKey(); if (next !== previous) { previous = next; reveal(); } };
    const observer = new MutationObserver((records) => {
      if (records.some((record) => [...record.removedNodes].some((node) => node instanceof Element && (node.matches('[aria-busy="true"]') || node.querySelector('[aria-busy="true"]'))))) reveal();
    });
    if (ref.current) observer.observe(ref.current, { childList: true, subtree: true });
    window.addEventListener(HISTORY_CHANGE, changed);
    window.addEventListener("popstate", changed);
    return () => { observer.disconnect(); animation.current?.cancel(); window.removeEventListener(HISTORY_CHANGE, changed); window.removeEventListener("popstate", changed); };
  }, []);
  return ref;
}
