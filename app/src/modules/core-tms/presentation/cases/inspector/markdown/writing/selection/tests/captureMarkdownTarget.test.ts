import assert from "node:assert/strict";
import test from "node:test";
import * as MarkdownEditor from "@mdxeditor/editor";
import { activeEditor$, directivesPlugin, headingsPlugin, listsPlugin, getSelectionAsMarkdown, inFocus$, insertMarkdown$,
  Realm, usedLexicalNodes$, type RealmPlugin } from "@mdxeditor/editor";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import { $createParagraphNode, $createTextNode, $getRoot, $isElementNode, $isTextNode, $setSelection,
  createEditor, UNDO_COMMAND } from "lexical";
import { captureMarkdownTarget } from "../captureMarkdownTarget";
import { fullMarkdown, markdownExportParameters } from "../serialization/markdownSerialization";
import { canImportMarkdown, insertPartialMarkdown } from "../serialization/validateMarkdown";
import { $createHeadingNode } from "@lexical/rich-text";
import { $createListNode, $createListItemNode } from "@lexical/list";

function harness() {
  const realm = new Realm();
  const { corePlugin } = MarkdownEditor as typeof MarkdownEditor & {
    corePlugin: (params: { suppressHtmlProcessing: boolean }) => RealmPlugin;
  };
  corePlugin({ suppressHtmlProcessing: true }).init?.(realm);
  headingsPlugin().init?.(realm); listsPlugin().init?.(realm);
  directivesPlugin({ directiveDescriptors: [{ name: "highlight", type: "textDirective", attributes: ["color"],
    hasChildren: true, testNode: (node) => node.name === "highlight", Editor: () => null }] }).init?.(realm);
  const editor = createEditor({ nodes: realm.getValue(usedLexicalNodes$), onError: (error) => { throw error; } });
  // Keep real Lexical transactions headless while testing the adapter's mounted-root guard.
  editor._headless = true;
  editor.focus = () => {};
  const root = { isConnected: true, focus() {} } as unknown as HTMLElement;
  editor.getRootElement = () => root;
  realm.pub(activeEditor$, editor); realm.pub(inFocus$, true);
  const parameters = markdownExportParameters(realm)!;
  const insert = (markdown: string) => realm.pub(insertMarkdown$, markdown);
  const capture = () => captureMarkdownTarget(editor, parameters, insert, (markdown) => canImportMarkdown(realm, editor, markdown),
    (markdown) => insertPartialMarkdown(realm, markdown));
  const state = createEmptyHistoryState();
  registerHistory(editor, state, 300);
  editor.update(() => {
    $getRoot().append($createParagraphNode().append($createTextNode("before "), $createTextNode("same").toggleFormat("bold"), $createTextNode(" after")),
      $createParagraphNode().append($createTextNode("same")));
    const last = $getRoot().getLastDescendant(); if ($isTextNode(last)) last.select(0, 4);
  }, { discrete: true });
  return { editor, root, parameters, capture, read: () => fullMarkdown(editor, parameters) };
}

test("selected duplicate text replaces only captured nodes and preserves neighboring formatting", () => {
  const h = harness(); const target = h.capture()!;
  assert.equal(target.selected, true); assert.equal(target.text, "same");
  assert.equal(target.apply("replacement"), true);
  assert.equal(h.read(), "before **same** after\n\nreplacement");
  assert.equal(target.apply("second response"), false);
});

test("formatting in the selected fragment is sent as Markdown", () => {
  const h = harness();
  h.editor.update(() => { const paragraph = $getRoot().getFirstChild();
    const text = $isElementNode(paragraph) ? paragraph.getChildren()[1] : null;
    if ($isTextNode(text)) text.select(0, 4);
  }, { discrete: true });
  assert.equal(h.capture()!.text, "**same**");
});

test("moving the caret during a request never redirects the captured replacement", () => {
  const h = harness(); const target = h.capture()!;
  h.editor.update(() => { $getRoot().selectStart(); }, { discrete: true });
  assert.equal(target.apply("changed"), true);
  assert.equal(h.read(), "before **same** after\n\nchanged");
});

test("a changed document, detached editor or readonly editor rejects stale responses", () => {
  const h = harness(); const target = h.capture()!;
  h.editor.update(() => { const text = $getRoot().getFirstDescendant();
    if ($isTextNode(text)) text.setTextContent("new before ");
  }, { discrete: true });
  assert.equal(target.apply("changed"), false);
  const detached = h.capture()!; Object.assign(h.root, { isConnected: false });
  assert.equal(detached.apply("changed"), false);
  Object.assign(h.root, { isConnected: true }); const readonly = h.capture()!;
  h.editor.setEditable(false); assert.equal(readonly.apply("changed"), false);
});

test("collapsed or absent selection targets the entire current field", () => {
  const h = harness(); h.editor.update(() => { $setSelection(null); }, { discrete: true });
  const target = h.capture()!;
  assert.equal(target.selected, false); assert.equal(target.text, "before **same** after\n\nsame");
  assert.equal(target.apply("**complete** field"), true);
  assert.equal(h.read(), "**complete** field");
});

test("an empty whole field remains available for a custom generation instruction", () => {
  const h = harness(); h.editor.update(() => { $getRoot().clear().append($createParagraphNode()); $setSelection(null); }, { discrete: true });
  const target = h.capture()!;
  assert.equal(target.selected, false); assert.equal(target.text, "");
  assert.equal(target.apply("Generated description"), true);
  assert.equal(h.read(), "Generated description");
});

test("equal text reloaded with new node identities cannot receive an old selection", () => {
  const h = harness(); const target = h.capture()!; const state = h.editor.getEditorState().toJSON();
  h.editor.setEditorState(h.editor.parseEditorState(state));
  assert.equal(target.apply("wrong position"), false);
});

test("AI replacement is one undoable edit", async () => {
  const h = harness(); const original = h.read();
  assert.equal(h.capture()!.apply("replacement"), true);
  h.editor.dispatchCommand(UNDO_COMMAND, undefined);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(h.read(), original);
});

test("unsupported AI Markdown does not replace or partially delete the captured content", () => {
  const h = harness(); const original = h.read();
  assert.equal(h.capture()!.apply("replacement :unsupported[content]"), false);
  assert.equal(h.read(), original);
});

test("highlight directives retain their color and content through selection export and replacement", () => {
  const h = harness(); h.editor.update(() => { $getRoot().select(0, $getRoot().getChildrenSize()); }, { discrete: true });
  assert.equal(h.capture()!.apply('before :highlight[marked]{color="blue"} after'), true);
  h.editor.update(() => { $getRoot().select(0, $getRoot().getChildrenSize()); }, { discrete: true });
  const markdown = getSelectionAsMarkdown(h.editor, h.parameters);
  assert.match(markdown, /:highlight\[marked\]\{color="?blue"?\}/);
  assert.equal(h.capture()!.apply(markdown), true);
  assert.match(h.read(), /:highlight\[marked\]\{color="?blue"?\}/);
});

test("a partial heading replacement preserves the heading on all unselected text", () => {
  const h = harness();
  h.editor.update(() => { const text = $createTextNode("Проверка авторизации");
    $getRoot().clear().append($createHeadingNode("h1").append(text)); text.select(0, 2);
  }, { discrete: true });
  assert.equal(h.capture()!.apply("**Уточнённый фрагмент**"), true);
  assert.equal(h.read(), "# **Уточнённый фрагмент**оверка авторизации");
});

test("a partial list item replacement preserves the list and neighboring inline formatting", () => {
  const h = harness();
  h.editor.update(() => { const text = $createTextNode("Проверка авторизации");
    $getRoot().clear().append($createListNode("bullet").append($createListItemNode().append(text, $createTextNode(" API").toggleFormat("bold")))); text.select(0, 2);
  }, { discrete: true });
  assert.equal(h.capture()!.apply("**Другой**"), true);
  assert.equal(h.read(), "* **Другой**оверка авторизации **API**");
});

test("explicit H1 H2 H3 AI output keeps every heading level on whole-field replacement", () => {
  const h = harness(); h.editor.update(() => { $setSelection(null); }, { discrete: true });
  const markdown = "# Авторизация\n\nОписание проверки.\n\n## Предусловия\n\nТестовый аккаунт.\n\n### Запрос\n\nGET /session";
  assert.equal(h.capture()!.apply(markdown), true);
  assert.equal(h.read(), markdown);
  const headings = h.editor.getEditorState().read(() => $getRoot().getChildren()
    .filter((node) => node.getType() === "heading").map((node) => node.exportJSON()));
  assert.deepEqual(headings.map((node) => (node as { tag?: string }).tag), ["h1", "h2", "h3"]);
});

test("a selected full paragraph accepts explicit AI heading levels", () => {
  const h = harness();
  assert.equal(h.capture()!.apply("## Заголовок\n\n### Подзаголовок"), true);
  assert.equal(h.read(), "before **same** after\n\n## Заголовок\n\n### Подзаголовок");
});

test("an explicit heading response is not flattened by the partial-block inline adapter", () => {
  const h = harness();
  h.editor.update(() => { const text = $createTextNode("Проверка авторизации");
    $getRoot().clear().append($createHeadingNode("h1").append(text)); text.select(0, 2);
  }, { discrete: true });
  assert.equal(h.capture()!.apply("## Уточнённый фрагмент"), true);
  assert.equal(h.read(), "## Уточнённый фрагмент\n\n# оверка авторизации");
});

test("a block reply preserves both outside headings and remains one undoable edit", async () => {
  const h = harness();
  h.editor.update(() => { const text = $createTextNode("before same after");
    $getRoot().clear().append($createHeadingNode("h1").append(text)); text.select(7, 11);
  }, { discrete: true });
  assert.equal(h.capture()!.apply("## Changed\n\n### Detail"), true);
  assert.equal(h.read(), "# before&#x20;\n\n## Changed\n\n### Detail\n\n# &#x20;after");
  h.editor.dispatchCommand(UNDO_COMMAND, undefined);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(h.read(), "# before same after");
});
