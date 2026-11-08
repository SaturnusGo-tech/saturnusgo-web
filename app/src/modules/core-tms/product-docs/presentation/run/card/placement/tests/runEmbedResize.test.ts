import assert from "node:assert/strict";
import test from "node:test";
import { resizeRunEmbedWidth } from "../runEmbedResize";

test("dragging the resize grip keeps the chosen edge or center anchored", () => {
  assert.equal(resizeRunEmbedWidth(500, 1000, 100, "left"), 60);
  assert.equal(resizeRunEmbedWidth(500, 1000, 100, "center"), 70);
  assert.equal(resizeRunEmbedWidth(500, 1000, -100, "right"), 60);
  assert.equal(resizeRunEmbedWidth(500, 1000, 100, "right"), 40);
});

test("resizing is bounded to the saved percentage range", () => {
  assert.equal(resizeRunEmbedWidth(300, 1000, -110, "left"), 28);
  assert.equal(resizeRunEmbedWidth(750, 1000, 200, "center"), 100);
  assert.equal(resizeRunEmbedWidth(400, 1000, 19, "left"), 42);
});
