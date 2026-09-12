import assert from "node:assert/strict";
import test from "node:test";
import { formatStepHeading } from "../formatHeading";
import { formatStepSelection } from "../formatSelection";

test("a first-line caret and an empty first line stay inside the inserted heading", () => {
  for (const value of ["First\nSecond", "\nSecond", ""]) {
    const result = formatStepHeading(value, 0, 0, 1);
    assert.equal(result.value, "# " + value);
    assert.equal(result.start, 2); assert.equal(result.end, 2);
  }
});

test("multi-line selection offsets retain precisely the selected boundary text", () => {
  const value = "before\nFirst line\nSecond line\nafter";
  const start = value.indexOf("st line"), end = value.indexOf("Second") + 6;
  const result = formatStepSelection(value, start, end, "h2");
  assert.equal(result.value, "before\n## First line\n## Second line\nafter");
  assert.equal(result.value.slice(result.start, result.end), "st line\n## Second");
  assert.equal(result.start, start + 3); assert.equal(result.end, end + 6);
});

test("selection ending at the next line start excludes that line", () => {
  const value = "First\nSecond\nThird", end = value.indexOf("Third");
  const result = formatStepHeading(value, 0, end, 3);
  assert.equal(result.value, "### First\n### Second\nThird");
  assert.equal(result.value.slice(result.start, result.end), "First\n### Second\n");
});

test("repeat level toggles, changing level replaces the marker and whitespace", () => {
  const value = "##\t  Same";
  const toggled = formatStepHeading(value, value.length, value.length, 2);
  assert.deepEqual(toggled, { value: "Same", start: 4, end: 4 });
  const changed = formatStepHeading(value, 0, value.length, 3);
  assert.deepEqual(changed, { value: "### Same", start: 4, end: 8 });
  assert.deepEqual(formatStepHeading("##", 2, 2, 2), { value: "", start: 0, end: 0 });
});

test("mixed levels become uniform and blank paragraph separators remain blank", () => {
  const value = "# First\n\nSecond\n\n### Third";
  const result = formatStepHeading(value, 0, value.length, 1);
  assert.equal(result.value, "# First\n\n# Second\n\n# Third");
  const toggled = formatStepHeading(result.value, result.start, result.end, 1);
  assert.equal(toggled.value, "First\n\nSecond\n\nThird");
});

test("fenced code is untouched even when an interior fence has an info string", () => {
  const code = "```text\nGET /session\n```js\nContent-Type: application/json\n```";
  const value = `Before\n\n${code}\n\nAfter`;
  assert.equal(formatStepHeading(value, 0, value.length, 2).value, `## Before\n\n${code}\n\n## After`);
  const start = value.indexOf("GET");
  assert.deepEqual(formatStepHeading(value, start, start + 3, 3), { value, start, end: start + 3 });
});

test("long and tilde fences, indentation, and unclosed code blocks are preserved", () => {
  for (const code of ["````md\n```\n# code\n````", "~~~json\n{\"ok\":true}\n~~~", "    GET /api\n    200 OK", "```\nGET /api"]) {
    assert.equal(formatStepHeading(code, 0, code.length, 1).value, code);
  }
});

test("code fences inside blockquotes and list items remain code", () => {
  for (const code of ["> ```\n> GET /api\n> ```", "- ```\n  GET /api\n  ```"]) {
    assert.equal(formatStepHeading(code, 0, code.length, 1).value, code);
  }
});

test("heading changes preserve nested list and blockquote structure", () => {
  const value = "> ## Quote\n\n- # Item\n  - Child\n\n1. Ordered";
  const result = formatStepHeading(value, 0, value.length, 3);
  assert.equal(result.value, "> ### Quote\n\n- ### Item\n  - ### Child\n\n1. ### Ordered");
});

test("CRLF lines retain line endings and selection boundaries", () => {
  const value = "One\r\nTwo\r\nThree", start = value.indexOf("Two"), end = value.indexOf("Three");
  const result = formatStepHeading(value, start, end, 2);
  assert.equal(result.value, "One\r\n## Two\r\nThree");
  assert.equal(result.value.slice(result.start, result.end), "Two\r\n");
});
