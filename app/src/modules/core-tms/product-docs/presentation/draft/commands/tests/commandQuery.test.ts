import assert from "node:assert/strict";
import test from "node:test";
import { productDocCommandQuery } from "../commandQuery";

test("slash commands match localized queries at the start of a line", () => {
  assert.equal(productDocCommandQuery("/"), "");
  assert.equal(productDocCommandQuery("/CODE BLOCK"), "code block");
  assert.equal(productDocCommandQuery("/Таблица"), "таблица");
});

test("slash commands leave ordinary slashes and Markdown shortcuts intact", () => {
  for (const input of ["See /table", "/api/v1", "https://falcon.example", "/#", "/-", "/\n"]) {
    assert.equal(productDocCommandQuery(input), null);
  }
});
