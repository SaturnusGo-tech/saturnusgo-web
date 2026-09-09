import assert from "node:assert/strict";
import test from "node:test";
import { sortFolderOptions } from "../folder-options";

test("unordered destinations keep root first and descendants beside their parent", () => {
  const paths = ["/Profile/Auth", "/Banking 2", "/Banking/Transfers/Outgoing", "/", "/Profile", "/Banking/Payments", "/Banking", "/Banking/Transfers"];
  const options = Object.freeze(paths.map((value) => Object.freeze({ value, label: value === "/" ? "Unfiled" : value })));
  const sorted = sortFolderOptions(options);
  assert.deepEqual(sorted.map((option) => option.value), [
    "/", "/Banking", "/Banking/Payments", "/Banking/Transfers", "/Banking/Transfers/Outgoing", "/Banking 2", "/Profile", "/Profile/Auth",
  ]);
  assert.equal(sorted[0].label, "Unfiled");
  assert.deepEqual(options.map((option) => option.value), paths);
});

test("Russian full paths keep the same hierarchy and natural sibling numbering", () => {
  const paths = ["/Профиль", "/Банк/Платежи 10", "/Банк/Переводы", "/Банк", "/Банк/Платежи 2", "/"];
  assert.deepEqual(sortFolderOptions(paths.map((value) => ({ value, label: value }))).map((option) => option.value), [
    "/", "/Банк", "/Банк/Переводы", "/Банк/Платежи 2", "/Банк/Платежи 10", "/Профиль",
  ]);
});
