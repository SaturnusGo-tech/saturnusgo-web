import assert from "node:assert/strict";
import test from "node:test";
import { createIntegrationSelection } from "../../selection/integration-selection";

test("optional values stay unselected unless an explicit empty option exists", () => {
  const empty = createIntegrationSelection([{ value: "first", label: "First" }], [""]);
  assert.deepEqual(empty.selectedKeys, []);
  assert.deepEqual(empty.valuesFor(new Set()), []);
  const explicit = createIntegrationSelection([{ value: "", label: "Keep unchanged" }, { value: "first", label: "First" }], [""]);
  assert.equal(explicit.selectedKeys.length, 1);
  assert.deepEqual(explicit.valuesFor(new Set(explicit.selectedKeys)), [""]);
});

test("unknown saved IDs remain selectable without silently replacing them", () => {
  const model = createIntegrationSelection([{ value: "known", label: "Known" }], ["retired-id", "known"]);
  assert.deepEqual(model.options.map(item => item.value), ["known", "retired-id"]);
  assert.equal(model.options[1].label, "retired-id");
  assert.deepEqual(model.valuesFor(new Set(model.selectedKeys)), ["retired-id", "known"]);
});

test("encoded keys distinguish empty and reserved-looking IDs; all is handled as selection", () => {
  const values = ["", "all", "value:", "0"];
  const model = createIntegrationSelection(values.map(value => ({ value, label: value || "None" })), values);
  assert.equal(new Set(model.selectedKeys).size, values.length);
  assert.deepEqual(model.valuesFor(new Set(model.selectedKeys)), values);
  assert.deepEqual(model.valuesFor("all"), values);
  assert.deepEqual(model.valuesFor(new Set(["unrecognized-key"])), []);
});

test("duplicate options and selections do not duplicate state", () => {
  const model = createIntegrationSelection([{ value: "one", label: "One" }, { value: "one", label: "Other" }], ["one", "one"]);
  assert.equal(model.options.length, 1);
  assert.equal(model.options[0].label, "One");
  assert.deepEqual(model.valuesFor(new Set(model.selectedKeys)), ["one"]);
});
