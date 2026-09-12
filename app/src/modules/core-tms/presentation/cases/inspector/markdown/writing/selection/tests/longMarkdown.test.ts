import assert from "node:assert/strict";
import test from "node:test";
import { $getRoot, $isElementNode, $isTextNode, UNDO_COMMAND } from "lexical";
import { longWritingHarness } from "./fixtures/longWritingHarness";

function longMarkdown(separator = "\n\n") {
  return Array.from({ length: 10 }, (_, section) => [
    `${"#".repeat(section % 3 + 1)} Проверка ${section + 1}`,
    ...Array.from({ length: 4 }, (_, paragraph) => `Абзац ${section + 1}.${paragraph + 1}: проверьте **авторизацию** и статус \`200 OK\`.\nВторая строка этого же абзаца.`),
    `* Первый пункт ${section + 1}\n* Второй пункт\n  * Вложенный пункт`,
    '```json\n{\n  "status": 200,\n  "message": "success"\n}\n```',
  ].join(separator)).join(separator);
}

test("40-paragraph AI replacement preserves block counts without extra paragraph nodes", () => {
  const source = longMarkdown();
  const baseline = longWritingHarness(); baseline.importSaved(source);
  const h = longWritingHarness(); h.importSaved("Исходный текст"); h.wholeField();
  assert.equal(h.capture()!.apply(source), true);
  assert.deepEqual(h.shape(), baseline.shape());
  assert.equal(h.shape().counts.heading, 10);
  assert.equal(h.shape().counts.codeblock, 10);
  assert.equal(h.shape().emptyParagraphs, 1); // The editor's terminal caret paragraph, after the code block.
  assert.equal(h.read(), baseline.read());
});

test("large replacement stays stable through repeated save/edit and AI apply cycles", () => {
  const h = longWritingHarness(); h.importSaved("Исходный текст"); h.wholeField();
  assert.equal(h.capture()!.apply(longMarkdown()), true);
  const original = h.read(), originalShape = h.shape();
  for (let cycle = 0; cycle < 4; cycle++) {
    const reopened = longWritingHarness(); reopened.importSaved(h.read());
    assert.equal(reopened.read(), original);
    assert.deepEqual(reopened.shape(), originalShape);
    h.wholeField(); assert.equal(h.capture()!.apply(reopened.read()), true);
    assert.equal(h.read(), original); assert.deepEqual(h.shape(), originalShape);
  }
});

test("AI output with excess blank source lines does not multiply visual empty paragraphs", () => {
  const normal = longWritingHarness(); normal.importSaved(longMarkdown());
  const h = longWritingHarness(); h.importSaved("Исходный текст"); h.wholeField();
  assert.equal(h.capture()!.apply(longMarkdown("\n\n\n\n")), true);
  assert.deepEqual(h.shape(), normal.shape());
  assert.equal(h.read(), normal.read());
});

test("a long response replacing a middle fragment adds no inter-block spacer paragraphs and can undo", async () => {
  const h = longWritingHarness(); h.importSaved("# Before same after");
  const original = h.read();
  h.editor.update(() => {
    const heading = $getRoot().getFirstChild(), text = $isElementNode(heading) ? heading.getFirstChild() : null;
    if ($isTextNode(text)) text.select(7, 11);
  }, { discrete: true });
  assert.equal(h.capture()!.apply(longMarkdown()), true);
  assert.equal(h.shape().emptyParagraphs, 1);
  assert.equal(h.shape().counts.heading, 12);
  assert.match(h.read(), /^# Before&#x20;\n\n# Проверка 1/);
  assert.match(h.read(), /# &#x20;after$/);
  h.editor.dispatchCommand(UNDO_COMMAND, undefined);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(h.read(), original);
});
