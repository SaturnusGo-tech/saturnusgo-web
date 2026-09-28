type Transition = { dialog: HTMLDialogElement; image: HTMLImageElement; origin: HTMLImageElement | null; closing: boolean; onFinish: () => void };
type Geometry = { left: number; top: number; width: number; height: number; clip: string };

/** Measure painted pixels, including gallery letterboxing and the viewer's scroll clipping. */
export function screenshotGeometry(image: HTMLImageElement): Geometry | null {
  const view = image.ownerDocument.defaultView;
  if (!view || !image.isConnected) return null;
  const bounds = image.getBoundingClientRect(), style = view.getComputedStyle(image);
  let { left, top, width, height } = bounds;
  if (!width || !height) return null;
  if (style.objectFit === "contain" && image.naturalWidth && image.naturalHeight) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const paintedWidth = image.naturalWidth * scale, paintedHeight = image.naturalHeight * scale;
    left += (width - paintedWidth) / 2; top += (height - paintedHeight) / 2;
    width = paintedWidth; height = paintedHeight;
  }
  let x1 = Math.max(0, left), y1 = Math.max(0, top);
  let x2 = Math.min(view.innerWidth, left + width), y2 = Math.min(view.innerHeight, top + height);
  for (let parent = image.parentElement; parent; parent = parent.parentElement) {
    const parentStyle = view.getComputedStyle(parent), box = parent.getBoundingClientRect();
    if (/(auto|scroll|hidden|clip)/.test(parentStyle.overflowX)) { x1 = Math.max(x1, box.left); x2 = Math.min(x2, box.right); }
    if (/(auto|scroll|hidden|clip)/.test(parentStyle.overflowY)) { y1 = Math.max(y1, box.top); y2 = Math.min(y2, box.bottom); }
  }
  if (x2 <= x1 || y2 <= y1) return null;
  const clip = `inset(${(y1 - top) / height * 100}% ${(left + width - x2) / width * 100}% ${(top + height - y2) / height * 100}% ${(x1 - left) / width * 100}%)`;
  return { left, top, width, height, clip };
}

/** The temporary image stays in the native dialog's top layer; cancellation never changes layout. */
export function startScreenshotTransition({ dialog, image, origin, closing, onFinish }: Transition): () => void {
  const document = dialog.ownerDocument, view = document.defaultView;
  const surface = dialog.querySelector<HTMLElement>("[data-screenshot-surface]");
  if (!view || !surface || typeof image.animate !== "function" || view.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    onFinish(); return () => {};
  }
  const target = screenshotGeometry(image), thumbnail = origin && screenshotGeometry(origin);
  const animations: Animation[] = [], visibility = image.style.visibility;
  let clone: HTMLImageElement | null = null, ended = false, observer: MutationObserver | undefined;
  let resize: ResizeObserver | undefined;
  const clean = (complete: boolean) => {
    if (ended) return; ended = true;
    for (const animation of animations) animation.cancel();
    clone?.remove(); image.style.visibility = visibility; delete dialog.dataset.imageMotion;
    document.removeEventListener("scroll", interrupt, true); view.removeEventListener("resize", interrupt);
    view.visualViewport?.removeEventListener("resize", interrupt); view.visualViewport?.removeEventListener("scroll", interrupt);
    observer?.disconnect(); resize?.disconnect();
    if (complete) onFinish();
  };
  const interrupt = () => clean(true);
  const addAnimation = (element: Element, frames: Keyframe[], duration: number) => {
    const animation = element.animate(frames, { duration, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
    void animation.finished.catch(() => {}); animations.push(animation);
  };
  try {
    dialog.dataset.imageMotion = closing ? "close" : "open";
    const duration = target && thumbnail ? closing ? 200 : 260 : 130;
    if (target && thumbnail) {
      clone = image.cloneNode(false) as HTMLImageElement;
      clone.removeAttribute("class"); clone.removeAttribute("id"); clone.removeAttribute("loading");
      clone.setAttribute("aria-hidden", "true"); clone.alt = "";
      Object.assign(clone.style, { position: "fixed", left: `${target.left}px`, top: `${target.top}px`,
        width: `${target.width}px`, height: `${target.height}px`, maxWidth: "none", minWidth: "0", margin: "0", padding: "0",
        border: "0", pointerEvents: "none", objectFit: "fill", transformOrigin: "0 0", zIndex: "1", visibility: "visible" });
      dialog.append(clone); image.style.visibility = "hidden";
      const small = { transform: `translate(${thumbnail.left - target.left}px, ${thumbnail.top - target.top}px) scale(${thumbnail.width / target.width}, ${thumbnail.height / target.height})`, clipPath: thumbnail.clip };
      const large = { transform: "translate(0px, 0px) scale(1, 1)", clipPath: target.clip };
      addAnimation(clone, closing ? [large, small] : [small, large], duration);
    }
    addAnimation(surface, closing ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }], duration);
    document.addEventListener("scroll", interrupt, true); view.addEventListener("resize", interrupt);
    view.visualViewport?.addEventListener("resize", interrupt); view.visualViewport?.addEventListener("scroll", interrupt);
    if (view.MutationObserver) {
      observer = new view.MutationObserver(() => { if (!image.isConnected || !dialog.open || (origin && !origin.isConnected)) interrupt(); });
      observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    }
    if (view.ResizeObserver) {
      resize = new view.ResizeObserver(() => {
        if (JSON.stringify(screenshotGeometry(image)) !== JSON.stringify(target)
          || (origin && JSON.stringify(screenshotGeometry(origin)) !== JSON.stringify(thumbnail))) interrupt();
      });
      resize.observe(image); if (origin) resize.observe(origin);
    }
    void Promise.all(animations.map(animation => animation.finished)).then(() => clean(true), () => clean(false));
  } catch { clean(true); }
  return () => clean(false);
}
