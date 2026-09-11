import assert from "node:assert/strict";
import { test } from "node:test";
import { clipboardMarkdown } from "../clipboardMarkdown";
import { isCodeInsertion } from "../pasteMarkdown";

test("headings, nested lists and exact query parameters survive browser copy", () => {
  const value = clipboardMarkdown('<h3>Пример GET</h3><ul><li><strong>URL:</strong> <a href="https://httpbin.org/get?name=test&amp;id=123">Запрос</a><ul><li>Параметры<ul><li><code>id=123</code></li></ul></li></ul></li></ul><h2>Как это работает</h2><p>Проверить ответ.</p>', "flat");
  assert.match(value!, /^### Пример GET\n\n-\s+\*\*URL:\*\*/);
  assert.match(value!, /https:\/\/httpbin.org\/get\?name=test&id=123/);
  assert.match(value!, /\n {4}-\s+Параметры\n {8}-\s+`id=123`/);
  assert.match(value!, /\n\n## Как это работает\n\nПроверить ответ\./);
});
test("fenced JSON retains whitespace, symbols, and a longer fence than payload", () => {
  const value = clipboardMarkdown('<pre><code class="language-json">{\n  "code": "```",\n  "xml": "&lt;request&gt;",\n  "url": "?a=1&amp;b=2"\n}\n</code></pre>', "");
  assert.equal(value, '````json\n{\n  "code": "```",\n  "xml": "<request>",\n  "url": "?a=1&b=2"\n}\n````');
});
test("ordinary Markdown and unsupported clipboard keep native plain-text paste", () => {
  assert.equal(clipboardMarkdown("", "## Heading\n- item"), null);
  assert.equal(clipboardMarkdown("x".repeat(1_000_001), "original"), null);
  assert.equal(clipboardMarkdown("<span></span>", "original"), "original");
});
test("links are safe and source UI is not copied", () => {
  const value = clipboardMarkdown('<p>Keep <a href="javascript:alert(1)">label</a>.</p><button>Copy code</button><script>alert(1)</script><span hidden>secret</span><img src="https://invalid.example/x" alt="diagram">', "");
  assert.equal(value, "Keep label.\n\ndiagram");
});
test("ordered lists keep numbering and quotation stays separate", () => {
  const value = clipboardMarkdown('<ol start="4"><li>First</li><li>Second</li></ol><blockquote><p>Expected</p></blockquote><p>Actual</p>', "");
  assert.match(value!, /^4\.\s+First\n5\.\s+Second/);
  assert.match(value!, /> Expected\n\nActual/);
});
test("headerless tables retain all rows without raw HTML", () => {
  const value = clipboardMarkdown('<table><tr><td>201</td><td>Created</td></tr><tr><td>400</td><td>Invalid | request</td></tr></table>', "");
  assert.match(value!, /\| 201 \| Created \|/);
  assert.match(value!, /Invalid \\\| request/);
  assert.doesNotMatch(value!, /<table/);
});
test("pasting inside code remains literal; closed fences accept rich text", () => {
  for (const prefix of ['```json\n{', '~~~\nGET', 'URL `GET ']) assert.equal(isCodeInsertion(prefix, prefix.length), true);
  for (const prefix of ['```json\n{}\n```\n', '~~~\nGET\n~~~\n', 'URL `GET` ']) assert.equal(isCodeInsertion(prefix, prefix.length), false);
});
