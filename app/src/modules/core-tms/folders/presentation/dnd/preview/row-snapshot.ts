export type RepositoryRowSnapshot = {
  node: HTMLElement;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

const rowSelector = "[data-repository-drag-row]";
const inertAttributes = ["id", "for", "aria-controls", "aria-labelledby", "aria-describedby", "aria-owns", "autofocus", "name", "href", "form", "draggable"];

function copyRowAppearance(source: Element, clone: Element, view: Window) {
  const styled = clone as HTMLElement | SVGElement;
  const computed = view.getComputedStyle(source);
  if (styled.style) {
    for (let index = 0; index < computed.length; index += 1) {
      const property = computed.item(index);
      styled.style.setProperty(property, computed.getPropertyValue(property), "important");
    }
    styled.style.setProperty("animation", "none", "important");
    styled.style.setProperty("transition", "none", "important");
    styled.style.setProperty("pointer-events", "none", "important");
    styled.style.setProperty("user-select", "none", "important");
  }
  inertAttributes.forEach(attribute => clone.removeAttribute(attribute));
  for (const attribute of Array.from(clone.attributes)) {
    if (attribute.name.startsWith("on") || attribute.name.startsWith("data-repository-drag")) clone.removeAttribute(attribute.name);
  }
  clone.removeAttribute("role");
  clone.setAttribute("tabindex", "-1");
  clone.setAttribute("aria-hidden", "true");
  if (clone.hasAttribute("contenteditable")) clone.setAttribute("contenteditable", "false");
  if (source.tagName === "INPUT") {
    const input = source as HTMLInputElement;
    (clone as HTMLInputElement).checked = input.checked;
    (clone as HTMLInputElement).indeterminate = input.indeterminate;
    (clone as HTMLInputElement).value = input.value;
  }
  Array.from(source.children).forEach((child, index) => {
    if (clone.children[index]) copyRowAppearance(child, clone.children[index], view);
  });
}

/** Capture before the source enters its dimmed dragging state, preserving its exact row layout. */
export function captureRepositoryRow(activeId: string, event: Event, initial?: { left: number; top: number } | null): RepositoryRowSnapshot | null {
  if (typeof document === "undefined") return null;
  const target = event.target as Element | null;
  const eventRow = typeof target?.closest === "function" ? target.closest<HTMLElement>(rowSelector) : null;
  const source = eventRow?.dataset.repositoryDragId === activeId ? eventRow
    : Array.from(document.querySelectorAll<HTMLElement>(rowSelector)).find(row => row.dataset.repositoryDragId === activeId);
  const view = source?.ownerDocument.defaultView;
  if (!source || !view) return null;
  const rect = source.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const clone = source.cloneNode(true) as HTMLElement;
  copyRowAppearance(source, clone, view);
  clone.setAttribute("inert", "");
  clone.removeAttribute("data-drag-source");
  clone.style.setProperty("box-sizing", "border-box", "important");
  clone.style.setProperty("width", `${rect.width}px`, "important");
  clone.style.setProperty("height", `${rect.height}px`, "important");
  clone.style.setProperty("margin", "0", "important");
  clone.style.setProperty("opacity", "1", "important");
  clone.style.setProperty("filter", "none", "important");
  clone.style.setProperty("transform", "none", "important");
  let node = clone;
  if (source.tagName === "TR") {
    const table = source.ownerDocument.createElement("table");
    const body = source.ownerDocument.createElement("tbody");
    table.style.cssText = `width:${rect.width}px;border-collapse:collapse;table-layout:fixed;pointer-events:none`;
    table.setAttribute("aria-hidden", "true"); table.setAttribute("inert", "");
    body.appendChild(clone); table.appendChild(body); node = table;
  }
  return { node, width: rect.width, height: rect.height, offsetX: initial ? rect.left - initial.left : 0, offsetY: initial ? rect.top - initial.top : 0 };
}
