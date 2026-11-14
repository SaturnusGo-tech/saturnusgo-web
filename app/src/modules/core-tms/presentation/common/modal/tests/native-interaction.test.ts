import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { Modal } from "../Modal";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";

test("modal overlays exclude native window dragging without changing the page drag regions", () => {
  const document = { activeElement: null, body: { style: { overflow: "auto" } }, addEventListener() {}, removeEventListener() {} };
  const h = componentHarness(undefined, { document, HTMLElement: class {} });
  Object.assign(h.window, { requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  const { Modal: View } = h.load<{ Modal: typeof Modal }>(new URL("../Modal.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: () => "Close" }) };
  });
  let closed = 0;
  try {
    for (const drawer of [true, false]) {
      const tree = nodes(h.render(() => View({ title: "Create", drawer, children: "Fields", onClose: () => { closed++; } })));
      const overlay = tree.find(node => node.props.role === "presentation")!;
      assert.ok(String(overlay.props.className).split(" ").includes("nativeSafe"),
        "a full-viewport no-drag region must protect every modal control from the underlying native title bar");
      const close = tree.find(node => node.type === "button" && node.props["aria-label"] === "Close")!;
      assert.equal(close.props.type, "button");
      invoke(close, "onClick");
      invoke(overlay, "onMouseDown", { target: "child", currentTarget: "backdrop" });
    }
    assert.equal(closed, 2, "the X still delegates once and interior clicks do not dismiss the modal");
    const css = readFileSync(new URL("../native-interaction.module.css", import.meta.url), "utf8");
    assert.match(css, /\.nativeSafe\s*\{[^}]*-webkit-app-region:\s*no-drag\s*;/);
    assert.doesNotMatch(css, /:global|\bbody\b|\bhtml\b|app-region:\s*drag\s*;/,
      "native interaction belongs to the mounted overlay, never a persistent page or global header rule");
  } finally {
    h.dispose();
    assert.equal(document.body.style.overflow, "auto", "unmount restores normal page interaction");
  }
});
