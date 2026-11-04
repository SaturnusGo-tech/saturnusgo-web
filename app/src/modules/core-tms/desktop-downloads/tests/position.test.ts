import assert from "node:assert/strict";
import { test } from "node:test";
import { desktopDownloadsPosition } from "../model/position";

test("download panel stays beside the profile and within a small viewport", () => {
  assert.deepEqual(desktopDownloadsPosition({ right: 56, top: 810, bottom: 840 }, { width: 1440, height: 900 }, 360), {
    left: 66, top: 480, maxHeight: 876,
  });
  assert.deepEqual(desktopDownloadsPosition({ right: 300, top: 40, bottom: 64 }, { width: 320, height: 240 }, 360), {
    left: 12, top: 12, maxHeight: 216,
  });
});
