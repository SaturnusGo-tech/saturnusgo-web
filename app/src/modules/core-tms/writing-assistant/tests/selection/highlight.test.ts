import assert from "node:assert/strict";
import test from "node:test";
import { highlightRanges } from "../../presentation/selection/rangeHighlight";

test("source highlight persists independently of focus and cleans up each session without changing content", (t) => {
  const highlights = new Map(); const styles = new Set(); let changed: () => void = () => {}; let disconnected = 0;
  const Original = globalThis.MutationObserver;
  Object.assign(globalThis, { MutationObserver: class {
    constructor(callback: () => void) { changed = callback; } observe() {} disconnect() { disconnected++; }
  } });
  t.after(() => { if (Original) globalThis.MutationObserver = Original; else Reflect.deleteProperty(globalThis, "MutationObserver"); });
  const document = { defaultView: { CSS: { highlights }, Highlight: class { constructor(public range: Range) {} } },
    createElement: () => { const style = { textContent: "", remove: () => styles.delete(style) }; return style; },
    head: { append: (style: unknown) => styles.add(style) } };
  const root = { ownerDocument: document, textContent: "**Текст • ✅**" } as unknown as HTMLElement;
  let valid = true;
  const source = {} as Range;
  const cleanup = highlightRanges(root, [source], () => valid);
  assert.equal(highlights.size, 1); assert.equal(styles.size, 1);
  assert.equal(Array.from(highlights.values())[0].range, source);
  changed(); assert.equal(highlights.size, 1);
  const next = highlightRanges(root, [source], () => valid);
  cleanup(); assert.equal(highlights.size, 1); assert.equal(styles.size, 1);
  valid = false; changed(); assert.equal(highlights.size, 0); assert.equal(styles.size, 0);
  next(); assert.ok(disconnected >= 2);
  assert.equal(root.textContent, "**Текст • ✅**");
});

test("detached or stale sources never acquire a highlight", () => {
  assert.doesNotThrow(() => highlightRanges({ ownerDocument: null } as unknown as HTMLElement, [], () => false)());
});
