import assert from "node:assert/strict";
import test from "node:test";
import { tmsMessages } from "../catalog/messages";
import { interpolateMessage } from "../model/message";

test("English and Russian catalogs have identical keys", () => {
  assert.deepEqual(
    Object.keys(tmsMessages.ru).sort(),
    Object.keys(tmsMessages.en).sort(),
  );
});

test("every localized message is non-empty", () => {
  for (const catalog of Object.values(tmsMessages)) {
    for (const message of Object.values(catalog)) {
      assert.notEqual(message.trim(), "");
    }
  }
});

test("interpolation replaces string and numeric values", () => {
  assert.equal(
    interpolateMessage("{name}: {count}", { name: "Smoke", count: 12 }),
    "Smoke: 12",
  );
});

test("interpolation keeps unresolved variables visible", () => {
  assert.equal(interpolateMessage("Run {name} · {count}", { count: 4 }), "Run {name} · 4");
});
