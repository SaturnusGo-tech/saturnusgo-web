import assert from "node:assert/strict";
import test from "node:test";
import { compactRunTitle } from "./compact-run-title";

test("generated Russian and English run names retain the test scope without duplicate context", () => {
  assert.equal(compactRunTitle("Umbrella-Host · HOST-TC-118 · Разовый · local-current · 05 сент., 21:32:43", "Umbrella-Host", "local-current"), "HOST-TC-118");
  assert.equal(compactRunTitle("Umbrella Host · Payments · Regression · v2.3 · Sep 5, 09:32:43 PM", "Umbrella Host", "v2.3"), "Payments");
  assert.equal(compactRunTitle("Umbrella Host · Смоук · — · 05 сент., 21:32:43", "Umbrella Host", null), "Смоук");
});

test("fix verification names omit only the matching build reference", () => {
  assert.equal(compactRunTitle("Проверка исправлений · local-current", "Umbrella Host", "local-current"), "Проверка исправлений");
  assert.equal(compactRunTitle("Fix verification · rc1", "Umbrella Host", "rc1"), "Fix verification");
  assert.equal(compactRunTitle("Fix verification · checkout", "Umbrella Host", "rc1"), "Fix verification · checkout");
});

test("custom names and ambiguous historical names preserve their meaning", () => {
  for (const title of ["Payments · local-current", "Umbrella Host · checkout · rc1", "  Refund after capture  ",
    "Umbrella Host · Payments · Review · rc1 · 05 сент., 21:32:43",
    "Umbrella Host · Payments · Regression · rc1 · pending"])
    assert.equal(compactRunTitle(title, "Umbrella Host", "rc1"), title.trim());
  const previousName = "Renamed project · Payments · Regression · rc1 · 05 сент., 21:32:43";
  assert.equal(compactRunTitle(previousName, "Umbrella Host", "rc1"), previousName);
});
