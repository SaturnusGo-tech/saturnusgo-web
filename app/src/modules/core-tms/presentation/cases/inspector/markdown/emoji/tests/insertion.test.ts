import { test } from "node:test";
import assert from "node:assert/strict";
import { createEditor, $getRoot, $createParagraphNode, $createTextNode, $getSelection, $setSelection, $isTextNode } from "lexical";
import { captureEmojiTarget } from "../selection/captureEmojiTarget";

test("rich text insertion restores the selected range after focus is lost and keeps bold", () => {
  const editor=createEditor({onError:error=>{throw error;}});
  editor.update(()=>{const text=$createTextNode("hello world");text.toggleFormat("bold");$getRoot().append($createParagraphNode().append(text));text.select(6,11);},{discrete:true});
  const target=captureEmojiTarget(editor,null);
  editor.update(()=>$setSelection(null),{discrete:true});
  assert.equal(target?.apply("✅"),true);
  editor.getEditorState().read(()=>{
    assert.equal($getRoot().getTextContent(),"hello ✅");
    const text=$getRoot().getFirstDescendant();
    assert.equal($isTextNode(text) && text.getFormat(),1);
    assert.equal($getSelection()?.getTextContent(),"");
  });
});
test("rich target refuses stale content and read-only editors", () => {
  const editor=createEditor({onError:error=>{throw error;}});
  editor.update(()=>{const text=$createTextNode("old");$getRoot().append($createParagraphNode().append(text));text.selectEnd();},{discrete:true});
  const target=captureEmojiTarget(editor,null);
  editor.update(()=>{const text=$getRoot().getFirstDescendant(); if($isTextNode(text)) text.setTextContent("new");},{discrete:true});
  assert.equal(target?.apply("✅"),false);
  editor.setEditable(false);
  assert.equal(captureEmojiTarget(editor,null),null);
});
