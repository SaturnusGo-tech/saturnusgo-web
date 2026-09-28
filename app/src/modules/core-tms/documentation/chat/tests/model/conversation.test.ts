import assert from "node:assert/strict";
import { test } from "node:test";
import { conversationContext, type GuideMessage } from "../../model/conversation";
import { visibleCitations } from "../../model/citations";
import { documentationCatalog } from "../../../localization/catalog/locale-catalog";
import { guideChatCopy } from "../../localization/copy";
import { shouldSendQuestion } from "../../presentation/composer/keyboard";

test("request history retains complete recent exchanges within server limits", () => {
  const messages: GuideMessage[] = Array.from({ length: 20 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: `${index}` }));
  const recent = conversationContext(messages, "new question");
  assert.equal(recent.length, 11); assert.equal(recent[0].content, "10");
  assert.deepEqual(recent[recent.length - 1], { role: "user", content: "new question" });
  const large = conversationContext([
    { role: "user", content: "older" }, { role: "assistant", content: "answer" },
    { role: "user", content: "u".repeat(8000) }, { role: "assistant", content: "a".repeat(16000) },
  ], "q".repeat(8000));
  assert.equal(large.length, 3);
  assert.ok(large.every(message => message.content.length <= 8000));
  assert.equal(large.reduce((sum, message) => sum + message.content.length, 0), 24000);
});

test("citations cannot expose hidden articles or invent section links and use local guide titles", () => {
  for (const locale of ["ru", "en"] as const) {
    const catalog = documentationCatalog(locale, false);
    const article = catalog.articleById.get("create-run")!;
    const allowed = { articleId: article.id, sectionId: article.sections[0].id, title: "<script>untrusted</script>" };
    const sources = visibleCitations([allowed, allowed,
      { ...allowed, sectionId: "unknown" }, { ...allowed, articleId: "company-access" },
      { ...allowed, articleId: "https://attacker.example" }], catalog.articleById);
    assert.equal(sources.length, 1); assert.equal(sources[0].title, article.title);
    assert.equal(sources[0].sectionTitle, article.sections[0].title);
  }
});

test("chat copy has matching locale keys and questions are not automatically sent by text entry", () => {
  assert.deepEqual(Object.keys(guideChatCopy.en).sort(), Object.keys(guideChatCopy.ru).sort());
  assert.equal(guideChatCopy.en.suggestions.length, 3); assert.equal(guideChatCopy.ru.suggestions.length, 3);
  const enter = { key: "Enter", shiftKey: false, altKey: false, ctrlKey: false, metaKey: false, nativeEvent: {} };
  assert.equal(shouldSendQuestion(enter), true);
  for (const event of [{ ...enter, shiftKey: true }, { ...enter, key: "a" }, { ...enter, metaKey: true },
    { ...enter, nativeEvent: { isComposing: true } }, { ...enter, nativeEvent: { keyCode: 229 } }]) assert.equal(shouldSendQuestion(event), false);
});
