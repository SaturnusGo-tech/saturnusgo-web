import assert from "node:assert/strict";
import test from "node:test";
import { classHighlighter, highlightCode } from "@lezer/highlight";
import { productDocCodeLanguage, productDocCodeLanguageLabel, productDocCodeLanguageValue, productDocLanguageOptions } from "../engine/codeLanguage";

test("each offered language has a loadable grammar and SQL styles actual tokens", async () => {
  const choices = productDocLanguageOptions("", "Plain text");
  assert.ok(choices.some(({ value }) => value === "sql"));
  for (const { value } of choices.slice(1)) {
    const grammar = await productDocCodeLanguage(value)?.load();
    assert.ok(grammar?.language.parser, value);
  }

  const sql = await productDocCodeLanguage("sql")!.load();
  const query = "select 42 from accounts where name = 'QA'";
  const classes = new Map<string, string>();
  highlightCode(query, sql.language.parser.parse(query), classHighlighter, (text, style) => classes.set(text, style), () => {});
  assert.equal(classes.get("select"), "tok-keyword");
  assert.equal(classes.get("42"), "tok-number");
  assert.equal(classes.get("'QA'"), "tok-string");
});

test("plain text stays unhighlighted and imported fence tokens keep readable labels", () => {
  for (const token of ["", "text", "txt", "PlainText"]) {
    assert.equal(productDocCodeLanguage(token), undefined);
    assert.equal(productDocCodeLanguageValue(token), "");
    assert.equal(productDocCodeLanguageLabel(token, "Plain text"), "Plain text");
  }
  assert.equal(productDocCodeLanguageValue("TypeScript"), "ts");
  assert.equal(productDocCodeLanguageLabel("TypeScript", "Plain text"), "TypeScript");
  assert.deepEqual(productDocLanguageOptions("private-dsl", "Plain text").find((option) => option.value === "private-dsl"),
    { value: "private-dsl", label: "private-dsl · Plain text" });
});
