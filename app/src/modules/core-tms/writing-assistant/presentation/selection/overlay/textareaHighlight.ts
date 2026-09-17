import { rangeOverlay } from "./rangeOverlay";

const textStyles = ["font", "font-family", "font-size", "font-weight", "font-style", "font-variant", "font-kerning",
  "font-feature-settings", "font-variation-settings", "line-height", "letter-spacing", "word-spacing", "text-indent",
  "text-align", "text-transform", "direction", "tab-size", "padding-top", "padding-right", "padding-bottom", "padding-left"];

export function highlightTextarea(node: HTMLTextAreaElement, source: string, start: number, end: number) {
  const document = node.ownerDocument, view = document.defaultView;
  if (!view || start === end) return () => {};
  const mirror = document.createElement("div");
  mirror.setAttribute("aria-hidden", "true");
  mirror.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;border:0;margin:0;box-sizing:border-box;";
  const text = document.createTextNode(source);
  mirror.append(text, document.createTextNode("\u200b"));
  document.body.append(mirror);
  const range = document.createRange(); range.setStart(text, start); range.setEnd(text, end);
  const stop = rangeOverlay(node, () => {
    const computed = view.getComputedStyle(node);
    for (const property of textStyles) mirror.style.setProperty(property, computed.getPropertyValue(property));
    mirror.style.width = `${node.clientWidth}px`;
    mirror.style.whiteSpace = node.wrap === "off" ? "pre" : "pre-wrap";
    mirror.style.overflowWrap = "break-word";
    const bounds = node.getBoundingClientRect(), origin = mirror.getBoundingClientRect();
    const left = bounds.left + node.clientLeft - node.scrollLeft - origin.left;
    const top = bounds.top + node.clientTop - node.scrollTop - origin.top;
    return Array.from(range.getClientRects(), (rect) => ({ left: rect.left + left, right: rect.right + left, top: rect.top + top, bottom: rect.bottom + top }));
  }, () => node.value === source && !node.hidden);
  return () => { stop(); mirror.remove(); };
}
