import assert from "node:assert/strict";
import test from "node:test";
import { flowchartInitialViewport } from "../viewport/flowchart-viewport";

test("opens a large branching diagram fully in view instead of clipping at eighty percent", () => {
  const bounds = { width: 2200, height: 1800 };
  const viewport = flowchartInitialViewport(bounds, 1100, 500);
  assert.ok(viewport.zoom < 0.8);
  assert.ok(viewport.x >= 20 && viewport.y >= 20);
  assert.ok(viewport.x + bounds.width * viewport.zoom <= 1080);
  assert.ok(viewport.y + bounds.height * viewport.zoom <= 480);
});

test("centers small diagrams without enlarging their typography", () => {
  assert.deepEqual(flowchartInitialViewport({ width: 200, height: 100 }, 1000, 500), { x: 400, y: 200, zoom: 1 });
});

test("fits both axes in narrow panels while keeping a usable finite zoom", () => {
  const viewport = flowchartInitialViewport({ width: 1200, height: 700 }, 320, 360);
  assert.equal(viewport.zoom, 280 / 1200);
  assert.ok(Number.isFinite(viewport.x) && Number.isFinite(viewport.y));
  assert.ok(viewport.y + 700 * viewport.zoom < 340);
});
