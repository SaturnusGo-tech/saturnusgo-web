import { rangeOverlay } from "./overlay/rangeOverlay";

let sequence = 0;

/** Paint an immutable source range without changing editor content, selection or undo history. */
export function highlightRanges(root: HTMLElement, ranges: Range[], valid: () => boolean) {
  const document = root.ownerDocument;
  const view = document?.defaultView;
  if (!view || !ranges.length || !valid()) return () => {};
  const api = view as Window & { CSS?: { highlights?: Map<string, unknown> }; Highlight?: new (...ranges: Range[]) => unknown };
  const registry = api.CSS?.highlights;
  if (!registry || !api.Highlight) return rangeOverlay(root, () => ranges.flatMap((range) => Array.from(range.getClientRects())), valid);
  const name = `falcon-ai-source-${++sequence}`;
  const style = document.createElement("style");
  style.textContent = `::highlight(${name}) { background-color: color-mix(in srgb, var(--falcon-info) 30%, transparent); color: inherit; }`;
  document.head.append(style);
  registry.set(name, new api.Highlight(...ranges));
  const observer = new MutationObserver(() => { if (!valid()) cleanup(); });
  observer.observe(root, { subtree: true, childList: true, characterData: true });
  function cleanup() { observer.disconnect(); registry!.delete(name); style.remove(); }
  return cleanup;
}
