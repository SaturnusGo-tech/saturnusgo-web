import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { DocumentationTree } from "../../../presentation/navigation/DocumentationTree";
import type { GuideComposer } from "../../presentation/composer/GuideComposer";
import { guideChatCopy } from "../../localization/copy";
import { documentationChatId } from "../../../navigation/documentation-link";
import { shouldSendQuestion } from "../../presentation/composer/keyboard";

test("Falcon AI is the first navigation item immediately after search, while article groups remain", () => {
  for (const locale of ["ru", "en"] as const) {
    const h = componentHarness(); let navigated = 0;
    const { DocumentationTree: render } = h.load<{ DocumentationTree: typeof DocumentationTree }>(new URL("../../../presentation/navigation/DocumentationTree.tsx", import.meta.url), name => {
      if (name.endsWith("useDocumentationCatalog")) return { useDocumentationCatalog: () => ({ locale, docGroups: [{ id: "start", title: "Start" }],
        docArticles: [{ id: "introduction", title: "Guide", group: "start" }] }) };
      if (name.endsWith("useDocumentationCopy")) return { useDocumentationCopy: () => ({ guideArticles: "Guide articles" }) };
      if (name.endsWith("documentation-link")) return { documentationChatId };
      if (name.endsWith("localization/copy")) return { guideChatCopy };
    });
    const navigation = { articleId: documentationChatId, link: (id: string) => `?article=${id}`, navigate: (event: { defaultPrevented: boolean }) => { event.defaultPrevented = true; } };
    const all = nodes(h.render(() => render({ navigation, query: "", onQuery() {}, searchRef: { current: null }, onSearch() {}, onNavigate: () => navigated++ } as Parameters<typeof render>[0])));
    const links = all.filter(node => node.type === "a");
    assert.equal(links[0].props.href, `?article=${documentationChatId}`); assert.equal(links[0].props["aria-current"], "page");
    assert.equal(nodes(links[0]).find(node => node.type === "span")?.props.children, guideChatCopy[locale].title);
    assert.ok(all.indexOf(all.find(node => node.props.role === "search")!) < all.indexOf(links[0]));
    assert.equal(links[1].props.href, "?article=introduction");
    invoke(links[0], "onClick", { defaultPrevented: false }); assert.equal(navigated, 1);
  }
});

test("composer sends on Enter, preserves Shift+Enter and IME, and dictation remains an editable draft", () => {
  const h = componentHarness(); let sent = 0, started = 0, stopped = 0, cancelled = 0, dictated = "";
  const dictation = { active: false, state: "idle", error: "", notice: "", start: () => started++, stop: () => stopped++ };
  let voiceOptions: Record<string, unknown> = {};
  const { GuideComposer: render } = h.load<{ GuideComposer: typeof GuideComposer }>(new URL("../../presentation/composer/GuideComposer.tsx", import.meta.url), name => {
    if (name.endsWith("useWritingDictation")) return { useWritingDictation: (options: Record<string, unknown>) => { voiceOptions = options; return dictation; } };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("conversation")) return { maximumQuestionCharacters: 8000 };
    if (name.endsWith("keyboard")) return { shouldSendQuestion };
  });
  const chat = { locale: "en", enabled: true, busy: false, draft: "How do I edit a run?", workspaceId: "w", scopeKey: "scope", conversationId: 1,
    setDraft: (value: string) => dictated = value, send: () => sent++, cancel: () => cancelled++ } as unknown as Parameters<typeof render>[0]["chat"];
  const all = () => nodes(h.render(() => render({ chat })));
  const event = { key: "Enter", shiftKey: false, altKey: false, ctrlKey: false, metaKey: false, nativeEvent: {}, preventDefault() {} };
  invoke(all().find(node => node.type === "textarea")!, "onKeyDown", event); assert.equal(sent, 1);
  invoke(all().find(node => node.type === "textarea")!, "onKeyDown", { ...event, shiftKey: true });
  invoke(all().find(node => node.type === "textarea")!, "onKeyDown", { ...event, nativeEvent: { isComposing: true } }); assert.equal(sent, 1);
  assert.equal(voiceOptions.purpose, "documentation"); assert.equal(voiceOptions.maximumCharacters, 8000);
  invoke(all().find(node => node.props["aria-label"] === "Dictate a question")!, "onClick"); assert.equal(started, 1);
  (voiceOptions.onChange as (text: string) => void)("Recognized question"); assert.equal(dictated, "Recognized question"); assert.equal(sent, 1);
  dictation.active = true; dictation.state = "listening";
  assert.equal(all().find(node => node.type === "textarea")?.props.readOnly, true);
  invoke(all().find(node => node.props["aria-label"] === "Stop dictation")!, "onClick"); assert.equal(stopped, 1);
  dictation.active = false; chat.busy = true;
  invoke(all().find(node => node.props["aria-label"] === "Stop response")!, "onClick"); assert.equal(cancelled, 1);
});
