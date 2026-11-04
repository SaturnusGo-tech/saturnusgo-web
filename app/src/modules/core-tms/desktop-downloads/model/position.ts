type Anchor = { readonly right: number; readonly top: number; readonly bottom: number };

export function desktopDownloadsPosition(anchor: Anchor, viewport: { width: number; height: number }, panelHeight: number) {
  const edge = 12, width = Math.min(360, Math.max(0, viewport.width - edge * 2));
  return {
    left: Math.max(edge, Math.min(anchor.right + 10, viewport.width - width - edge)),
    top: Math.max(edge, Math.min(anchor.bottom - panelHeight, viewport.height - panelHeight - edge)),
    maxHeight: Math.max(0, viewport.height - edge * 2),
  };
}
