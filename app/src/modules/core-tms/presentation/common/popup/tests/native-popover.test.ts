import test from "node:test";
import assert from "node:assert/strict";
import { hideNativePopover } from "../useAnchoredPopup";

test("fallback browsers never evaluate an unsupported popover selector", () => {
  const element = { matches() { throw new SyntaxError("Unsupported pseudo-class"); } } as unknown as HTMLElement;
  assert.doesNotThrow(() => hideNativePopover(element));
});

test("native popovers are hidden only while open", () => {
  let open = true, hidden = 0;
  const element = { matches: () => open, hidePopover() { hidden += 1; open = false; } } as unknown as HTMLElement;
  hideNativePopover(element); hideNativePopover(element);
  assert.equal(hidden, 1);
});
