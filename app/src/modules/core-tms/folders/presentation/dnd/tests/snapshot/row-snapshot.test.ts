import assert from "node:assert/strict";
import test from "node:test";
import { captureRepositoryRow } from "../../preview/row-snapshot";

class FakeStyle {
  values = new Map<string, string>();
  cssText = "";
  setProperty(name: string, value: string) { this.values.set(name, value); }
}
class FakeElement {
  style = new FakeStyle(); children: FakeElement[] = []; parent: FakeElement | null = null;
  checked = false; indeterminate = false; value = ""; textContent = "";
  attributesMap = new Map<string, string>();
  constructor(public tagName: string, public ownerDocument: FakeDocument) {}
  get attributes() { return [...this.attributesMap].map(([name, value]) => ({ name, value })); }
  get dataset() { return { repositoryDragId: this.attributesMap.get("data-repository-drag-id") }; }
  setAttribute(name: string, value: string) { this.attributesMap.set(name, value); }
  removeAttribute(name: string) { this.attributesMap.delete(name); }
  hasAttribute(name: string) { return this.attributesMap.has(name); }
  getAttribute(name: string) { return this.attributesMap.get(name); }
  appendChild(child: FakeElement) { this.children.push(child); child.parent = this; return child; }
  closest(): FakeElement | null { return this.hasAttribute("data-repository-drag-row") ? this : this.parent?.closest() ?? null; }
  getBoundingClientRect() { return { width: 420, height: 48, left: 24, top: 72 }; }
  cloneNode() {
    const clone = new FakeElement(this.tagName, this.ownerDocument);
    clone.attributesMap = new Map(this.attributesMap); clone.checked = this.checked; clone.value = this.value; clone.textContent = this.textContent;
    this.children.forEach(child => clone.appendChild(child.cloneNode())); return clone;
  }
}
class FakeDocument {
  rows: FakeElement[] = [];
  defaultView = { getComputedStyle: (node: FakeElement) => {
    const values = { color: "rgb(210, 210, 210)", "font-size": "13px", display: node.tagName === "TR" ? "table-row" : "grid", "grid-template-columns": "20px 0px 376px 24px" };
    const names = Object.keys(values);
    return { length: names.length, item: (index: number) => names[index], getPropertyValue: (name: keyof typeof values) => values[name] };
  } };
  querySelectorAll() { return this.rows; }
  createElement(tag: string) { return new FakeElement(tag.toUpperCase(), this); }
}
function withDocument(run: (doc: FakeDocument) => void) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  const doc = new FakeDocument();
  Object.defineProperty(globalThis, "document", { configurable: true, value: doc });
  try { run(doc); } finally { if (previous) Object.defineProperty(globalThis, "document", previous); else Reflect.deleteProperty(globalThis, "document"); }
}
function sourceRow(doc: FakeDocument, tag = "LI") {
  const row = new FakeElement(tag, doc);
  row.setAttribute("data-repository-drag-row", ""); row.setAttribute("data-repository-drag-id", "tree-case:1");
  row.setAttribute("id", "original-row"); doc.rows.push(row); return row;
}
const eventFor = (target?: FakeElement) => ({ target } as unknown as Event);

test("drag snapshot preserves the actual row geometry, title, key, icon and inherited appearance", () => withDocument(doc => {
  const source = sourceRow(doc);
  const button = source.appendChild(new FakeElement("BUTTON", doc));
  const icon = button.appendChild(new FakeElement("SVG", doc)); icon.setAttribute("viewBox", "0 0 24 24");
  const title = button.appendChild(new FakeElement("SPAN", doc)); title.textContent = "Booking works";
  const key = title.appendChild(new FakeElement("SMALL", doc)); key.textContent = "HOST-TC-115";
  const snapshot = captureRepositoryRow("tree-case:1", eventFor(title), { left: 48, top: 80 });
  assert.ok(snapshot); assert.notEqual(snapshot.node, source);
  assert.deepEqual({ width: snapshot.width, height: snapshot.height, x: snapshot.offsetX, y: snapshot.offsetY }, { width: 420, height: 48, x: -24, y: -8 });
  const clone = snapshot.node as unknown as FakeElement;
  assert.equal(clone.style.values.get("width"), "420px");
  assert.equal(clone.children[0].children[1].textContent, "Booking works");
  assert.equal(clone.children[0].children[1].children[0].textContent, "HOST-TC-115");
  assert.equal(clone.children[0].children[0].getAttribute("viewBox"), "0 0 24 24");
  assert.equal(clone.children[0].children[1].style.values.get("font-size"), "13px");
}));

test("snapshot is inert presentation without duplicate IDs, focus targets, links or active handlers", () => withDocument(doc => {
  const source = sourceRow(doc); const link = source.appendChild(new FakeElement("A", doc));
  for (const [name, value] of Object.entries({ id: "title", href: "/case/1", onclick: "bad()", "aria-controls": "menu", role: "button", contenteditable: "true" })) link.setAttribute(name, value);
  const input = link.appendChild(new FakeElement("INPUT", doc)); input.checked = true; input.indeterminate = true; input.value = "Selected"; input.setAttribute("name", "case");
  const snapshot = captureRepositoryRow("tree-case:1", eventFor(link)); assert.ok(snapshot);
  const clone = snapshot.node as unknown as FakeElement; const cloneLink = clone.children[0];
  assert.equal(clone.hasAttribute("id"), false); assert.equal(clone.hasAttribute("inert"), true);
  for (const name of ["id", "href", "onclick", "aria-controls", "role"]) assert.equal(cloneLink.hasAttribute(name), false);
  assert.equal(cloneLink.getAttribute("tabindex"), "-1"); assert.equal(cloneLink.getAttribute("aria-hidden"), "true");
  assert.equal(cloneLink.getAttribute("contenteditable"), "false"); assert.equal(cloneLink.style.values.get("pointer-events"), "none");
  assert.equal(cloneLink.children[0].checked, true); assert.equal(cloneLink.children[0].indeterminate, true); assert.equal(cloneLink.children[0].value, "Selected");
  assert.equal(source.getAttribute("id"), "original-row"); assert.equal(link.getAttribute("href"), "/case/1");
}));

test("snapshot lookup handles keyboard/non-element targets, missing rows and table row layout", () => withDocument(doc => {
  assert.equal(captureRepositoryRow("missing", eventFor()), null);
  const row = sourceRow(doc, "TR"); row.appendChild(new FakeElement("TD", doc));
  const snapshot = captureRepositoryRow("tree-case:1", eventFor()); assert.ok(snapshot);
  const table = snapshot.node as unknown as FakeElement;
  assert.equal(table.tagName, "TABLE"); assert.equal(table.children[0].tagName, "TBODY"); assert.equal(table.children[0].children[0].tagName, "TR");
  assert.equal(table.hasAttribute("inert"), true);
  row.getBoundingClientRect = () => ({ width: 0, height: 0, left: 0, top: 0 });
  assert.equal(captureRepositoryRow("tree-case:1", eventFor()), null);
}));
