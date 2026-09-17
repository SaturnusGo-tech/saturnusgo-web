import assert from "node:assert/strict";
import test from "node:test";
import { $createRangeSelection, $getRoot, $getSelection, $isRangeSelection, $setSelection, type BaseSelection } from "lexical";
import { longWritingHarness } from "../fixtures/longWritingHarness";
import { exportFragment } from "../../serialization/fragment/exportFragment";

for (const fragment of ["слово", "Одно предложение.", "• @#$% & < > + = / \\ * _ : [ ] { }", "👩🏽‍💻 ✅ e\u0301", "Полный абзац\nсо второй строкой."]) {
  test(`arbitrary selected text roundtrips and replaces only its captured offsets: ${fragment}`, () => {
    const h = longWritingHarness(); h.importSaved("Начало **сосед** конец.");
    h.editor.update(() => {
      const nodes = $getRoot().getAllTextNodes(); const text = nodes[nodes.length - 1];
      text.setTextContent(` до ${fragment} после.`).select(4, 4 + fragment.length);
    }, { discrete: true });
    const target = h.capture()!;
    assert.equal(target.selected, true); assert.ok(target.text);
    assert.equal(target.apply("Замена"), true);
    assert.equal(h.read(), "Начало **сосед** до Замена после.");
  });
}

test("backward selection across bold, marker, inline code and literal punctuation exports every character", () => {
  const h = longWritingHarness();
  h.importSaved('До **слово •** :highlight[маркер ✅]{color="blue"} `код_*` после.');
  h.editor.update(() => {
    const nodes = $getRoot().getAllTextNodes();
    const start = nodes.find((node) => node.getTextContent() === "слово •")!;
    const end = nodes.find((node) => node.getTextContent() === "код_*")!;
    const selection = $createRangeSelection();
    selection.setTextNodeRange(end, end.getTextContentSize(), start, 0); $setSelection(selection);
  }, { discrete: true });
  const target = h.capture()!;
  assert.match(target.text, /\*\*слово •\*\*/);
  assert.match(target.text, /:highlight\[маркер ✅\]\{color="?blue"?\}/);
  assert.match(target.text, /`код_\*`/);
  assert.equal(target.apply("Заменено"), true);
  assert.equal(h.read(), "До Заменено после.");
});

test("whole selected document includes heading, ordered and nested bullet lists", () => {
  const h = longWritingHarness();
  h.importSaved("## Проверка\n\n1. Первый\n2. Второй\n   * **Вложенный**\n   * Символ •\n\nПоследний абзац.");
  const original = h.read();
  h.editor.update(() => $getRoot().select(0, $getRoot().getChildrenSize()), { discrete: true });
  const target = h.capture()!;
  assert.equal(target.text, original);
  assert.equal(target.apply(target.text), true);
  assert.equal(h.read(), original);
});

test("export uses the supplied selection even after live selection moves to another paragraph", () => {
  const h = longWritingHarness(); h.importSaved("Первый **выбранный** абзац.\n\nДругой абзац.");
  let selected: BaseSelection | null = null;
  h.editor.update(() => {
    const text = $getRoot().getAllTextNodes().find((node) => node.getTextContent() === "выбранный")!;
    text.select(0, text.getTextContentSize()); selected = $getSelection()?.clone() ?? null;
  }, { discrete: true });
  h.editor.update(() => $getRoot().selectEnd(), { discrete: true });
  assert.equal(exportFragment(h.editor, selected!, h.parameters), "**выбранный**");
  h.editor.getEditorState().read(() => assert.ok($isRangeSelection($getSelection()) && $getSelection()!.isCollapsed()));
});
