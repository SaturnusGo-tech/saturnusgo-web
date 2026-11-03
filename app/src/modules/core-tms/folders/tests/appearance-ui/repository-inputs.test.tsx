import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import postcss from "postcss";
import { createParser, type AstRule } from "css-selector-parser";

test("repository input hiding is restricted to direct selection checkboxes, leaving popup search fields visible", async () => {
  const css = postcss.parse(await readFile(new URL("../../presentation/styles/repository.module.css", import.meta.url), "utf8"));
  const selectors = createParser(); let guarded = 0;
  css.walkRules(rule => {
    if (!rule.nodes.some(node => node.type === "decl" && node.prop === "visibility" && node.value === "hidden")) return;
    for (const start of selectors(rule.selector).rules) {
      for (let node: AstRule | undefined = start; node; node = node.nestedRule) {
        if (!node.items.some(item => item.type === "TagName" && item.name === "input")) continue;
        guarded++;
        assert.equal(node.combinator, ">", "nested popup inputs must not inherit row selection hiding");
        assert.ok(node.items.some(item => item.type === "Attribute" && item.name === "type" && item.operator === "=" &&
          item.value?.type === "String" && item.value.value === "checkbox"), "search inputs, including disabled configuration states, must remain visible");
      }
    }
  });
  assert.ok(guarded >= 2, "normal and disabled selection checkbox visibility are covered");
});
