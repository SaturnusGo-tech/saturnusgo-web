import { useLayoutEffect, useRef, type RefObject } from "react";
import { screenshotGeometry, startScreenshotTransition } from "./shared-image";

/** A changed slide returns to its own visible thumbnail; never fly a new image into an unrelated one. */
export function screenshotOrigin(button: HTMLButtonElement | null, selected: number, image: HTMLImageElement): HTMLImageElement | null {
  const scope = button?.closest("[data-guide-image-scope], article");
  const current = scope?.querySelector<HTMLImageElement>(`[data-guide-image-index="${selected}"] img`);
  const original = button?.querySelector<HTMLImageElement>("img");
  return [current, original].find(candidate => candidate?.src === image.src && screenshotGeometry(candidate)) ?? null;
}

export function useScreenshotMotion(dialog: RefObject<HTMLDialogElement | null>, image: RefObject<HTMLImageElement | null>,
  origin: RefObject<HTMLButtonElement | null> | undefined, selected: number | null, onSelect: (index: number | null) => void) {
  const active = useRef<(() => void) | null>(null), closing = useRef(false);
  const latest = useRef({ selected, onSelect }); latest.current = { selected, onSelect };
  const cancel = () => { active.current?.(); active.current = null; };
  useLayoutEffect(() => {
    cancel(); closing.current = false;
    const element = dialog.current;
    if (!element) return;
    if (selected === null) { if (element.open) element.close(); return; }
    if (!element.open) {
      element.showModal();
      if (image.current) active.current = startScreenshotTransition({ dialog: element, image: image.current,
        origin: screenshotOrigin(origin?.current ?? null, selected, image.current), closing: false, onFinish() {} });
    }
    return cancel;
  }, [selected]);

  function close() {
    if (closing.current) return;
    cancel(); closing.current = true;
    const element = dialog.current, currentImage = image.current, index = latest.current.selected;
    const target = currentImage && index !== null ? screenshotOrigin(origin?.current ?? null, index, currentImage) : null;
    const finish = () => {
      active.current = null; closing.current = false; element?.close(); latest.current.onSelect(null);
      if (target?.isConnected) target.closest<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    };
    if (element?.open && currentImage) active.current = startScreenshotTransition({ dialog: element,
      image: currentImage, origin: target, closing: true, onFinish: finish });
    else finish();
  }
  return { close, select: (index: number) => { if (!closing.current) { cancel(); latest.current.onSelect(index); } },
    closed: () => { if (!dialog.current?.open) { cancel(); latest.current.onSelect(null); } } };
}
