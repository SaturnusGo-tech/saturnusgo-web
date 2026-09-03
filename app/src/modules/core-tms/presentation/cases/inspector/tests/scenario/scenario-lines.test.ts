import assert from "node:assert/strict";
import test from "node:test";
import {
  insertScenarioLine,
  joinScenarioAction,
  removeScenarioLine,
  replaceScenarioLine,
  scenarioLineLabel,
  splitScenarioAction,
} from "../../steps/support/scenarioLines";

test("scenario actions round-trip as a main step with technical substeps", () => {
  const lines = splitScenarioAction("Открыть браузер\nВвести адрес\nНажать Enter");
  assert.deepEqual(lines, ["Открыть браузер", "Ввести адрес", "Нажать Enter"]);
  assert.equal(joinScenarioAction(lines), "Открыть браузер\nВвести адрес\nНажать Enter");
  assert.deepEqual(lines.map((_, index) => scenarioLineLabel(2, index)), ["2", "2.1", "2.2"]);
});

test("Enter inserts a technical substep directly after the active line", () => {
  assert.deepEqual(insertScenarioLine(["Основной", "Второй"], 0), ["Основной", "", "Второй"]);
});

test("an empty technical substep can be removed without removing the main step", () => {
  assert.deepEqual(removeScenarioLine(["Основной", "", "Второй"], 1), ["Основной", "Второй"]);
  assert.deepEqual(removeScenarioLine(["Основной"], 0), ["Основной"]);
});

test("multiline paste expands into sequential technical substeps", () => {
  assert.deepEqual(
    replaceScenarioLine(["Основной", "После"], 0, "Открыть\r\nВвести\nПодтвердить"),
    ["Открыть", "Ввести", "Подтвердить", "После"],
  );
});
