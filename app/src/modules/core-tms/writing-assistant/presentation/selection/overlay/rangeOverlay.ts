type Box = { left: number; top: number; right: number; bottom: number };

/** Fallback paint layer, also used for textarea selections whose DOM lives inside native controls. */
export function rangeOverlay(root: HTMLElement, readRects: () => Box[], valid: () => boolean) {
  const document = root.ownerDocument, view = document.defaultView;
  if (!view) return () => {};
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.dataset.falconAiSelection = "true";
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2190;overflow:hidden;";
  document.body.append(layer);
  let frame = 0, disposed = false;
  function paint() {
    frame = 0;
    if (disposed) return;
    if (!root.isConnected || !valid()) { cleanup(); return; }
    const clip = visibleBox(root);
    const rects = readRects().filter((rect, index, all) => !all.some((other, otherIndex) =>
      otherIndex < index && other.left <= rect.left && other.right >= rect.right && other.top <= rect.top && other.bottom >= rect.bottom));
    const boxes = rects.map((rect) => {
      const left = Math.max(rect.left, clip.left), top = Math.max(rect.top, clip.top);
      const right = Math.min(rect.right, clip.right), bottom = Math.min(rect.bottom, clip.bottom);
      if (right <= left || bottom <= top) return null;
      const box = document.createElement("span");
      box.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:${right-left}px;height:${bottom-top}px;background:rgb(70 147 245 / 30%);border-radius:2px;`;
      return box;
    }).filter((box): box is HTMLSpanElement => Boolean(box));
    layer.replaceChildren(...boxes);
  }
  function schedule() { if (!disposed && !frame) frame = view!.requestAnimationFrame(paint); }
  const resize = new ResizeObserver(schedule);
  for (let parent: HTMLElement | null = root; parent; parent = parent.parentElement) resize.observe(parent);
  const mutation = new MutationObserver(schedule);
  mutation.observe(root, { subtree: true, childList: true, characterData: true, attributes: true });
  view.addEventListener("scroll", schedule, true);
  view.addEventListener("resize", schedule);
  root.addEventListener("input", schedule);
  view.visualViewport?.addEventListener("resize", schedule);
  view.visualViewport?.addEventListener("scroll", schedule);
  function cleanup() {
    if (disposed) return;
    disposed = true; view!.cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); layer.remove();
    view!.removeEventListener("scroll", schedule, true); view!.removeEventListener("resize", schedule);
    root.removeEventListener("input", schedule);
    view!.visualViewport?.removeEventListener("resize", schedule); view!.visualViewport?.removeEventListener("scroll", schedule);
  }
  paint();
  return cleanup;
}

function visibleBox(root: HTMLElement): Box {
  const view = root.ownerDocument.defaultView!;
  const source = root.getBoundingClientRect();
  const clip = { left: Math.max(0, source.left), top: Math.max(0, source.top),
    right: Math.min(view.innerWidth, source.right), bottom: Math.min(view.innerHeight, source.bottom) };
  for (let parent = root.parentElement; parent; parent = parent.parentElement) {
    const style = view.getComputedStyle(parent), rect = parent.getBoundingClientRect();
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { clip.left = Math.max(clip.left, rect.left); clip.right = Math.min(clip.right, rect.right); }
    if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { clip.top = Math.max(clip.top, rect.top); clip.bottom = Math.min(clip.bottom, rect.bottom); }
  }
  return clip;
}
