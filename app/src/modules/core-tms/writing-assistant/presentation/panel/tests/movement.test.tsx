import assert from "node:assert/strict";
import { test } from "node:test";
import { popupHarness } from "./popup-harness";

test("a short click or early movement does not detach the panel; a held drag does", (t) => {
  const h = popupHarness(t);
  const original = h.get().position;
  h.down(); h.up(); h.hold(); assert.equal(h.get().dragging, false);
  h.down(); h.move(570, 130); h.hold(); assert.equal(h.get().dragging, false);
  assert.deepEqual(h.get().position, original);
  h.down(); h.hold(); assert.equal(h.get().dragging, true);
  h.move(650, 180, 2); assert.deepEqual(h.get().position, original);
  h.move(650, 180); assert.equal(h.get().position.left, original.left + 100);
  assert.equal(h.get().position.top, original.top + 50);
  h.up(); assert.equal(h.get().dragging, false); assert.equal(h.captured(), null);
  assert.equal(h.closed(), 0);
});

test("manual position survives scrolling and response growth, with visible edges after resize", (t) => {
  const h = popupHarness(t);
  h.down(); h.hold(); h.move(250, 500); h.up();
  assert.equal(h.get().position.left, 200); assert.equal(h.get().position.top, 480);
  h.origin.left = 800; h.origin.bottom = -300; h.scroll();
  assert.equal(h.get().position.left, 200); assert.equal(h.get().position.top, 480);
  h.box.height = 500; h.resize();
  assert.equal(h.get().position.left, 200); assert.equal(h.get().position.top, 288);
  h.viewport.width = 400; h.viewport.height = 350; h.resize();
  assert.deepEqual(h.get().position, { left: 12, top: 12, maxWidth: "376px", maxHeight: "326px" });
});

test("drag clamps to every edge and visual viewport offsets", (t) => {
  const h = popupHarness(t);
  h.down(); h.hold(); h.move(-500, -500);
  assert.equal(h.get().position.left, 12); assert.equal(h.get().position.top, 12);
  h.move(5000, 5000);
  assert.equal(h.get().position.left, 628); assert.equal(h.get().position.top, 568);
  h.up(); h.viewport.offsetLeft = 80; h.viewport.offsetTop = 160; h.viewport.width = 700; h.viewport.height = 500;
  h.resize();
  assert.equal(h.get().position.left, 208); assert.equal(h.get().position.top, 428);
});

test("cancel, lost capture, backgrounding and closing clear long-press timers and release the pointer", (t) => {
  const h = popupHarness(t);
  for (const end of [h.cancel, h.lost, h.blur, h.hide, h.disable]) {
    const position = h.get().position;
    h.down(); end(); h.hold(); h.move(700, 250);
    assert.equal(h.get().dragging, false); assert.equal(h.captured(), null);
    assert.deepEqual(h.get().position, position); assert.equal(h.closed(), 0);
  }
});

test("keyboard movement detaches from the anchor without pointer input", (t) => {
  const h = popupHarness(t);
  h.key("ArrowLeft"); h.key("ArrowDown", true);
  assert.equal(h.get().position.left, 484); assert.equal(h.get().position.top, 158);
  h.origin.bottom = 400; h.scroll(); assert.equal(h.get().position.top, 158);
  h.key("a"); assert.equal(h.get().position.left, 484);
});
