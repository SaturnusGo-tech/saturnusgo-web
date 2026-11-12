import assert from "node:assert/strict";
import test from "node:test";
import { $createLinkNode, LinkNode } from "@lexical/link";
import { $createParagraphNode, $createTextNode, $getRoot, $getNodeByKey, $getSelection, $isElementNode, $isRangeSelection, $isTextNode, createEditor } from "lexical";
import { registerCaseReferences } from "../registerCaseReferences";
import type { CaseReference } from "../../domain/caseReference";

const scope = { workspaceId: "workspace-a", projectId: "project-a" };
const record: CaseReference = { id: "case-real", projectId: scope.projectId, key: "HOST-TC-375", title: "Retry safely" };
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const makeEditor = () => createEditor({ nodes: [LinkNode], onError: error => { throw error; } });
const context = { scope, resolver: { resolve: async (key: string) => key === record.key ? record : null } };

test("Lexical enhances imported prose with real title/URL, preserves emphasis and skips code/links/unknown keys", async () => {
  const editor = makeEditor();
  editor.update(() => {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode("See HOST-TC-375, HOST-TC-375 and HOST-TC-999. ").setFormat("bold"),
      $createTextNode("HOST-TC-375").setFormat("code"),
      $createTextNode(" https://site.test/HOST-TC-375 "),
      $createLinkNode("https://existing.test").append($createTextNode("HOST-TC-375")));
    $getRoot().append(paragraph);
  }, { discrete: true });
  const unregister = registerCaseReferences(editor, context, "https://company.falcon.test");
  await tick(); await tick();
  editor.getEditorState().read(() => {
    assert.equal($getRoot().getTextContent(), "See Retry safely, Retry safely and HOST-TC-999. HOST-TC-375 https://site.test/HOST-TC-375 HOST-TC-375");
    const paragraph = $getRoot().getFirstChildOrThrow();
    assert.ok($isElementNode(paragraph));
    const references = paragraph.getChildren().filter(node => node.getType() === "link") as LinkNode[];
    assert.equal(references.length, 3);
    assert.equal(new URL(references[0].getURL()).searchParams.get("caseId"), record.id);
    assert.equal(references[0].getFirstChildOrThrow().exportJSON().type, "text");
    assert.equal(($getNodeByKey(references[0].getFirstChildOrThrow().getKey()) as ReturnType<typeof $createTextNode>).hasFormat("bold"), true);
    assert.equal(references[2].getURL(), "https://existing.test");
  });
  unregister();
});

test("Lexical waits for a delimiter while typing a key and preserves following text/caret", async () => {
  const editor = makeEditor();
  let key = "";
  editor.update(() => {
    const text = $createTextNode("HOST-TC-375"); key = text.getKey();
    $getRoot().append($createParagraphNode().append(text)); text.selectEnd();
  }, { discrete: true });
  const unregister = registerCaseReferences(editor, context, "https://company.falcon.test");
  await tick();
  editor.getEditorState().read(() => assert.equal($getRoot().getTextContent(), "HOST-TC-375"));
  editor.update(() => {
    const text = $getNodeByKey(key);
    assert.ok($isTextNode(text)); text.setTextContent("HOST-TC-375 "); text.selectEnd();
  }, { discrete: true });
  await tick(); await tick();
  editor.getEditorState().read(() => {
    assert.equal($getRoot().getTextContent(), "Retry safely ");
    const selection = $getSelection(); assert.ok($isRangeSelection(selection));
    const node = $getNodeByKey(selection.anchor.key); assert.ok($isTextNode(node));
    assert.equal(node.getTextContent(), " ");
    assert.equal(selection.anchor.offset, 1, "caret stays after the user's delimiter");
  });
  unregister();
});

test("late responses cannot rewrite edited text or a disposed editor subscription", async () => {
  const editor = makeEditor(); let key = ""; let finish: (value: CaseReference) => void = () => {};
  editor.update(() => { const text = $createTextNode("HOST-TC-375"); key = text.getKey();
    $getRoot().append($createParagraphNode().append(text)); }, { discrete: true });
  const unregister = registerCaseReferences(editor, { scope,
    resolver: { resolve: () => new Promise(resolve => { finish = resolve; }) } }, "https://company.falcon.test");
  editor.update(() => { const node = $getNodeByKey(key); if ($isTextNode(node)) node.setTextContent("User changed the text"); }, { discrete: true });
  finish(record); await tick(); await tick();
  editor.getEditorState().read(() => assert.equal($getRoot().getTextContent(), "User changed the text"));
  unregister();
  editor.update(() => { const node = $getNodeByKey(key); if ($isTextNode(node)) node.setTextContent("HOST-TC-375"); }, { discrete: true });
  const detach = registerCaseReferences(editor, { scope,
    resolver: { resolve: () => new Promise(resolve => { finish = resolve; }) } }, "https://company.falcon.test");
  detach(); finish(record); await tick(); await tick();
  editor.getEditorState().read(() => assert.equal($getRoot().getTextContent(), "HOST-TC-375"));
});

test("a delayed response cannot turn text newly formatted as inline code into a link", async () => {
  const editor = makeEditor(); let key = ""; let finish: (value: CaseReference) => void = () => {};
  editor.update(() => { const text = $createTextNode("HOST-TC-375"); key = text.getKey();
    $getRoot().append($createParagraphNode().append(text)); }, { discrete: true });
  const detach = registerCaseReferences(editor, { scope,
    resolver: { resolve: () => new Promise(resolve => { finish = resolve; }) } }, "https://company.falcon.test");
  editor.update(() => { const node = $getNodeByKey(key); if ($isTextNode(node)) node.toggleFormat("code"); }, { discrete: true });
  finish(record); await tick(); await tick();
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(key); assert.ok($isTextNode(node));
    assert.equal(node.getTextContent(), "HOST-TC-375"); assert.equal(node.hasFormat("code"), true);
    assert.equal(node.getParentOrThrow().getType(), "paragraph");
  });
  detach();
});
