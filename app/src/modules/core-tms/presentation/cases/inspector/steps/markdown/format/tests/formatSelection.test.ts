import assert from "node:assert/strict";
import test from "node:test";
import { formatStepSelection } from "../formatSelection";

test("formatting keeps selected HTTP request, JSON indentation, and surrounding action intact", () => {
  const request = 'POST /v1/transfers\nContent-Type: application/json\n\n{\n  "amount": 150,\n  "currency": "RUB"\n}';
  const value = `Отправьте запрос: ${request} Проверьте ответ.`;
  const start = value.indexOf(request);
  const result = formatStepSelection(value, start, start + request.length, "code");
  assert.equal(result.value, `Отправьте запрос: \n\`\`\`\n${request}\n\`\`\`\n Проверьте ответ.`);
  assert.equal(result.value.slice(result.start, result.end), request);
});

test("code containing backticks gets a longer fence and does not escape its code block", () => {
  const value = '```json\n{"ok":true}\n```';
  const result = formatStepSelection(value, 0, value.length, "code");
  assert.equal(result.value, '````\n' + value + '\n````');
  assert.equal(result.value.slice(result.start, result.end), value);
});

test("inline code preserves backticks and status values", () => {
  for (const value of ['201 Created', '`field`']) {
    const result = formatStepSelection(value, 0, value.length, "inline");
    assert.equal(result.value.slice(result.start, result.end), value);
    assert.equal(result.value, value === '`field`' ? '`` `field` ``' : '`201 Created`');
  }
});

test("empty code insertion places the cursor inside its fences", () => {
  const result = formatStepSelection('', 0, 0, "code");
  assert.equal(result.value, '```\n\n```');
  assert.equal(result.start, 4);
  assert.equal(result.end, 4);
});
