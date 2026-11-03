import assert from "node:assert/strict";
import test from "node:test";
import { screenshotStep as english } from "../../content/walkthroughs/media/screenshot-step";
import { screenshotStep as russian } from "../../content-ru/walkthroughs/media/screenshot-step";

test("unregistered guide images fail before an incomplete illustration can be published", () => {
  for (const step of [english, russian]) {
    assert.throws(() => step("unregistered-capture" as never, "Title", "Instruction", "Outcome", "Alt text"), /unregistered/i);
  }
});
