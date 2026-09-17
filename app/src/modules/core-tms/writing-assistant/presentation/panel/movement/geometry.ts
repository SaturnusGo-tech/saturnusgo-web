export type PopupPoint = { left: number; top: number };
export const POPUP_MARGIN = 12;

export function popupViewport() {
  const viewport = window.visualViewport;
  return { left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight };
}

export function constrainPopup(point: PopupPoint, box: { width: number; height: number }, viewport = popupViewport()): PopupPoint {
  const left = viewport.left + POPUP_MARGIN, top = viewport.top + POPUP_MARGIN;
  return { left: Math.max(left, Math.min(point.left, viewport.left + viewport.width - box.width - POPUP_MARGIN)),
    top: Math.max(top, Math.min(point.top, viewport.top + viewport.height - box.height - POPUP_MARGIN)) };
}
