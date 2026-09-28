import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { DocumentationChat } from "../../presentation/DocumentationChat";
import type { GuideMessage } from "../../presentation/messages/GuideMessage";
import type { GuideMarkdown } from "../../presentation/messages/GuideMarkdown";
import { guideChatCopy } from "../../localization/copy";
import { guideHistoryCopy } from "../../history/localization/copy";
import { visibleCitations } from "../../model/citations";
import { visibleGuideVisuals } from "../../model/visuals/visible-visuals";
import { documentationCatalog } from "../../../localization/catalog/locale-catalog";

test("suggestions submit immediately and are disabled during a response; reset and retry remain explicit", () => {
  const h = componentHarness(), sent: string[] = []; let draft = "", resets = 0, retries = 0;
  const { DocumentationChat: render } = h.load<{ DocumentationChat: typeof DocumentationChat }>(new URL("../../presentation/DocumentationChat.tsx", import.meta.url), name => {
    if (name.includes("history/localization/copy")) return { guideHistoryCopy };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useConversationScroll")) return { useConversationScroll: () => ({ scroll: { current: null }, onScroll() {} }) };
  });
  const chat = { locale: "en", messages: [], enabled: true, busy: false, error: "", draft: "",
    setDraft: (value: string) => draft = value, send: async (value: string) => { sent.push(value); }, newChat: () => resets++, retry: () => retries++ } as unknown as Parameters<typeof render>[0]["chat"];
  const all = () => nodes(h.render(() => render({ chat, navigation: {} as never, onSource() {} })));
  const suggestion = all().find(node => node.type === "button" && nodes(node).some(child => child.props.children === guideChatCopy.en.suggestions[0]))!;
  invoke(suggestion, "onClick"); assert.deepEqual(sent, [guideChatCopy.en.suggestions[0]]); assert.equal(draft, "");
  chat.busy = true;
  const busySuggestion = all().find(node => node.type === "button" && nodes(node).some(child => child.props.children === guideChatCopy.en.suggestions[0]))!;
  assert.equal(busySuggestion.props.disabled, true);
  chat.busy = false; chat.draft = "Retry question"; chat.error = "unavailable";
  invoke(all().find(node => node.props["aria-label"] === "New chat")!, "onClick"); assert.equal(resets, 1);
  const retry = all().find(node => node.type === "button" && nodes(node).some(child => Array.isArray(child.props.children) && child.props.children.includes("Try again")))!;
  invoke(retry, "onClick"); assert.equal(retries, 1);
});

test("assistant sources open only verified internal article and section links", () => {
  const h = componentHarness(), catalog = documentationCatalog("en", false);
  const { GuideMessage: render } = h.load<{ GuideMessage: typeof GuideMessage }>(new URL("../../presentation/messages/GuideMessage.tsx", import.meta.url), name => {
    if (name.endsWith("useDocumentationCatalog")) return { useDocumentationCatalog: () => catalog };
    if (name.includes("history/localization/copy")) return { guideHistoryCopy };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("citations")) return { visibleCitations };
    if (name.endsWith("visible-visuals")) return { visibleGuideVisuals };
  });
  const article = catalog.articleById.get("create-run")!, section = article.sections[0];
  const opened: string[][] = []; let selected = 0;
  const navigation = { link: (id: string, section: string) => `?view=help&article=${id}#${section}`,
    navigate: (event: { defaultPrevented: boolean }, id: string, section: string) => { event.defaultPrevented = true; opened.push([id, section]); } };
  const all = nodes(h.render(() => render({ message: { role: "assistant", content: "Answer", citations: [
    { articleId: article.id, sectionId: section.id, title: "Wrong title" }, { articleId: "unknown", sectionId: "missing", title: "External" },
  ] }, navigation: navigation as never, onSource: () => selected++ })));
  const links = all.filter(node => node.type === "a"); assert.equal(links.length, 1);
  assert.equal(links[0].props.href, `?view=help&article=${article.id}#${section.id}`);
  invoke(links[0], "onClick", { defaultPrevented: false }); assert.deepEqual(opened, [[article.id, section.id]]); assert.equal(selected, 1);
});

test("Markdown disables raw HTML, remote media and generated links; citations are separate", () => {
  const h = componentHarness();
  const { GuideMarkdown: render } = h.load<{ GuideMarkdown: typeof GuideMarkdown }>(new URL("../../presentation/messages/GuideMarkdown.tsx", import.meta.url), name => {
    if (name.endsWith("guide-formatting")) return { guideRemarkPlugins: () => [] };
    if (name === "react-markdown") return { __esModule: true, default: "Markdown" };
  });
  const markdown = nodes(h.render(() => render({ content: "![track](https://external.example/image) <script>bad()</script>" }))).find(node => node.type === "Markdown")!;
  assert.equal(markdown.props.skipHtml, true);
  assert.ok((markdown.props.disallowedElements as string[]).includes("img"));
  assert.equal((markdown.props.urlTransform as (value: string) => string)("https://external.example"), "");
  assert.equal((markdown.props.urlTransform as (value: string) => string)("javascript:alert(1)"), "");
});

test("streaming text replaces the checking indicator before the validated answer is committed", () => {
  const h = componentHarness();
  const { DocumentationChat: render } = h.load<{ DocumentationChat: typeof DocumentationChat }>(new URL("../../presentation/DocumentationChat.tsx", import.meta.url), name => {
    if (name.includes("history/localization/copy")) return { guideHistoryCopy };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useConversationScroll")) return { useConversationScroll: () => ({ scroll: { current: null }, onScroll() {} }) };
  });
  const chat = { locale: "en", messages: [{ role: "user", content: "Question" }], partialText: "Actual streamed words", busy: true,
    enabled: true, draft: "", error: "", conversationId: 1 } as unknown as Parameters<typeof render>[0]["chat"];
  const all = nodes(h.render(() => render({ chat, navigation: {} as never, onSource() {} })));
  assert.equal(all.some(node => Array.isArray(node.props.children) && node.props.children.includes(guideChatCopy.en.preparing)), false);
  const partial = all.find(node => node.type === "GuideMessage" && node.props.streaming)!;
  assert.equal((partial.props.message as { content: string }).content, "Actual streamed words");
});
