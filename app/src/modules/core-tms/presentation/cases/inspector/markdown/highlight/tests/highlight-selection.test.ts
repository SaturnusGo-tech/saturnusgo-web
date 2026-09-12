import assert from "node:assert/strict";
import test from "node:test";
import { formatHighlightSelection } from "../selection/highlightSelection";

test("compact editor changes only selected characters and returns the new source selection", () => {
  const value = "A gentle word after";
  const result = formatHighlightSelection(value, 9, 13, "green");
  assert.equal(result.value, 'A gentle :highlight[word]{color="green"} after');
  assert.equal(result.value.slice(result.start, result.end), ':highlight[word]{color="green"}');
  assert.deepEqual(formatHighlightSelection(result.value, result.start, result.end, null), { value, start: 9, end: 13 });
});

test("headings and list markers retain their Markdown block semantics", () => {
  const value = "## Heading\n\n- **Bold** item\n- Next";
  const result = formatHighlightSelection(value, 0, value.length, "yellow");
  assert.match(result.value, /^## :highlight\[Heading\]/);
  assert.match(result.value, /\n- :highlight\[\*\*Bold\*\* item\]/);
  assert.equal(formatHighlightSelection(result.value, result.start, result.end, null).value, value);
});

test("brackets, quotes and links remain valid Markdown after marking and removing", () => {
  for (const value of ['value ] bracket', '[API](https://example.test)', 'say "hello" & value']) {
    const marked = formatHighlightSelection(value, 0, value.length, "blue");
    assert.match(marked.value, /:highlight\[/);
    const unmarked = formatHighlightSelection(marked.value, marked.start, marked.end, null);
    assert.ok(!unmarked.value.includes(':highlight['));
  }
});

test("code fences and invalid offsets are left intact", () => {
  const code = '```json\n{"name":"value"}\n```';
  assert.equal(formatHighlightSelection(code, 10, 14, "pink").value, code);
  assert.equal(formatHighlightSelection("abc", -1, 2, "pink").value, "abc");
  assert.equal(formatHighlightSelection("abc", 1, 1, "pink").value, "abc");
});
