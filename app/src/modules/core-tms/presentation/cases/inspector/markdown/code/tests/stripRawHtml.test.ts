import assert from "node:assert/strict";
import test from "node:test";
import { stripRawHtml } from "../stripRawHtml";

test("XML and HTML examples survive inside fenced code while raw markup stays suppressed", () => {
  const code = '```xml\n<request>\n  <amount>100</amount>\n</request>\n```';
  assert.equal(stripRawHtml('<b>Запрос</b>\n\n' + code + '\n<i>Ответ</i>'), 'Запрос\n\n' + code + '\nОтвет');
});
test("unclosed, longer and tilde fences preserve literal payloads", () => {
  for (const code of ['~~~html\n<div>x</div>\n~~~~', '````text\n```\n<value>\n````', '```html\n<script>alert(1)</script>']) assert.equal(stripRawHtml(code), code);
});
test("ordinary multiline text and outside HTML comments keep the established policy", () => {
  for (const value of ['', 'plain\n\ntext\n', '\r\nplain\r\n']) assert.equal(stripRawHtml(value), value);
  assert.equal(stripRawHtml('a<!--\nhidden\n-->b'), 'ab');
});
