import { useEffect, type RefObject } from "react";
import { HISTORY_CHANGE, readNavigationContext, saveNavigationContext } from "../../../state/navigation/browser/workspace-history";
type Position = { key: string; top: number; left: number };
function elements(root: HTMLElement) {
  const counts = new Map<string, number>();
  return [root, ...root.querySelectorAll<HTMLElement>("div, main, section, aside, ul")].map(element => {
    const name = `${element.tagName}:${element.className}`; const index = counts.get(name) ?? 0; counts.set(name, index + 1);
    return { element, key: `${name}:${index}` };
  });
}
export function useHistoryScroll(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let pending: Position[] | null = readNavigationContext("scroll", null);
    let frame = 0; let timer: ReturnType<typeof setTimeout>; let lastSaved = 0; let deadline = Date.now() + 10000;
    const restore = () => {
      if (!pending || !ref.current || Date.now() > deadline) return;
      const nodes = elements(ref.current);
      const done = pending.every(position => {
        const element = nodes.find(node => node.key === position.key)?.element;
        if (!element || element.scrollHeight < position.top + element.clientHeight - 1) return false;
        element.scrollTo(position.left, position.top); return true;
      });
      if (done) pending = null;
    };
    const save = () => {
      if (pending || !ref.current) return;
      saveNavigationContext("scroll", elements(ref.current).filter(({ element }) => element.scrollTop || element.scrollLeft)
        .slice(0, 40).map(({ key, element }) => ({ key, top: element.scrollTop, left: element.scrollLeft })));
    };
    const scroll = () => {
      clearTimeout(timer);
      if (Date.now() - lastSaved > 750) { save(); lastSaved = Date.now(); }
      else timer = setTimeout(save, 160);
    };
    const pop = () => { pending = readNavigationContext("scroll", null); deadline = Date.now() + 10000; requestAnimationFrame(restore); };
    const changed = () => { pending = null; cancelAnimationFrame(frame); };
    const interact = () => { pending = null; save(); };
    const observer = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(restore); });
    if (ref.current) observer.observe(ref.current, { childList: true, subtree: true });
    const size = new ResizeObserver(restore); if (ref.current) size.observe(ref.current);
    ref.current?.addEventListener("scroll", scroll, true);
    ref.current?.addEventListener("pointerdown", interact, true);
    ref.current?.addEventListener("wheel", interact, { passive: true });
    window.addEventListener("popstate", pop); window.addEventListener(HISTORY_CHANGE, changed);
    const root = ref.current; requestAnimationFrame(restore);
    return () => {
      cancelAnimationFrame(frame); clearTimeout(timer); observer.disconnect(); size.disconnect();
      root?.removeEventListener("scroll", scroll, true); root?.removeEventListener("pointerdown", interact, true);
      root?.removeEventListener("wheel", interact);
      window.removeEventListener("popstate", pop); window.removeEventListener(HISTORY_CHANGE, changed);
    };
  }, [ref]);
}
