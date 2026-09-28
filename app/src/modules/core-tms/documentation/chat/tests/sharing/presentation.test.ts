import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { DocumentationChat } from "../../presentation/DocumentationChat";
import type { GuideMessage } from "../../presentation/messages/GuideMessage";
import { guideChatCopy } from "../../localization/copy";
import { guideHistoryCopy } from "../../history/localization/copy";
import { documentationCatalog } from "../../../localization/catalog/locale-catalog";
import { visibleCitations } from "../../model/citations";
import { visibleGuideVisuals } from "../../model/visuals/visible-visuals";

test("shared answer renders only its two messages and starts an independent chat without a composer", () => {
  const h = componentHarness(); let started = 0;
  const { DocumentationChat: render } = h.load<{ DocumentationChat: typeof DocumentationChat }>(new URL("../../presentation/DocumentationChat.tsx", import.meta.url), name => {
    if (name.includes("history/localization/copy")) return { guideHistoryCopy };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("useConversationScroll")) return { useConversationScroll: () => ({ scroll: { current: null }, onScroll() {} }) };
  });
  const chat = { readonly: true, locale: "en", conversationId: "share", messages: [{ role: "user", content: "Selected question" },
    { role: "assistant", content: "Selected answer" }], startOwn: () => started++ } as unknown as Parameters<typeof render>[0]["chat"];
  const all = nodes(h.render(() => render({ chat, navigation: {} as never, onSource() {} })));
  assert.equal(all.some(node => node.type === "GuideComposer"), false);
  const messages = all.filter(node => node.type === "GuideMessage"); assert.equal(messages.length, 2);
  assert.ok(messages.every(node => node.props.sharing === undefined));
  invoke(all.find(node => node.type === "button" && node.props.children === guideHistoryCopy.en.startOwn)!, "onClick"); assert.equal(started, 1);
});

test("saved Russian answers resolve Russian guide sources even with an English interface", () => {
  const h = componentHarness(), catalog = documentationCatalog("ru", false); let requested: unknown;
  const { GuideMessage: render } = h.load<{ GuideMessage: typeof GuideMessage }>(new URL("../../presentation/messages/GuideMessage.tsx", import.meta.url), name => {
    if (name.endsWith("useDocumentationCatalog")) return { useDocumentationCatalog: (locale: unknown) => { requested = locale; return catalog; } };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("citations")) return { visibleCitations };
    if (name.endsWith("visible-visuals")) return { visibleGuideVisuals };
  });
  const article = catalog.articleById.get("create-run")!, section = article.sections[0];
  const all = nodes(h.render(() => render({ message: { role: "assistant", locale: "ru", content: "Ответ", citations: [
    { articleId: article.id, sectionId: section.id, title: "Ignored" }] }, navigation: { link: () => "?source" } as never, onSource() {} })));
  assert.equal(requested, "ru"); assert.ok(all.some(node => node.type === "a" && nodes(node).some(child => child.props.children === section.title)));
});
