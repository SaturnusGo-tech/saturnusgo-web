import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { DocumentationHeader } from "../../presentation/header/DocumentationHeader";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import { defaultArticleId, documentationChatId, documentationLink, safeArticleId } from "../../navigation/documentation-link";
import { guideChatLink, readGuideChatRoute } from "../../chat/navigation/chat-link";
import { documentationCopy } from "../../localization/ui-copy";

const help = "https://tms.example/work/?workspaceId=w&projectId=p&view=help";
const chat = "94e3be6c-8fc9-48a9-b4c4-4d5e98e0c040";
const turn = "b1e5a4d8-8ab8-4b52-9455-4899206a941f";
const chatHref = `${help}&article=falcon-ai-chat&chat=${chat}&message=${turn}`;

function header(href = help, locale: "en" | "ru" = "en", historyOpen = false) {
  const h = componentHarness(href);
  let navigated = 0, toggles = 0;
  const { useDocumentationNavigation: useNavigation } = h.load<{ useDocumentationNavigation: typeof useDocumentationNavigation }>(new URL("../../navigation/useDocumentationNavigation.ts", import.meta.url), name => {
    if (name.endsWith("documentation-link")) return { defaultArticleId, documentationChatId, documentationLink, safeArticleId };
    if (name.endsWith("chat-link")) return { guideChatLink, readGuideChatRoute };
    if (name.endsWith("workspace-history")) return { HISTORY_CHANGE: "falcon:navigation", navigateWorkspace: (target: string) => {
      h.navigate(new URL(target, h.window.location.href).href); h.emit("falcon:navigation");
    } };
  });
  const { DocumentationHeader: render } = h.load<{ DocumentationHeader: typeof DocumentationHeader }>(new URL("../../presentation/header/DocumentationHeader.tsx", import.meta.url), name => {
    if (name.endsWith("documentation-link")) return { documentationChatId };
    if (name.endsWith("useDocumentationCopy")) return { useDocumentationCopy: () => documentationCopy[locale] };
  });
  const all = () => {
    const view = () => {
      const navigation = useNavigation("owner");
      return render({ navigation, chatting: navigation.articleId === documentationChatId, treeOpen: true, historyOpen, onTreeToggle: () => toggles++,
        onNavigate: () => navigated++, onSearch() {}, isLight: true, onThemeChange() {} });
    };
    h.render(view);
    return nodes(h.render(view));
  };
  return { all, tabs: () => nodes(all().find(node => node.type === "nav")).filter(node => node.type === "a"),
    visit(target: string) { h.navigate(target); h.emit("popstate"); }, href: () => h.window.location.href,
    navigated: () => navigated, toggles: () => toggles, dispose: h.dispose };
}

function mouse(modifiers = {}) {
  return { button: 0, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false,
    defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...modifiers };
}

test("the header exposes separate localized Docs and AI links with the selected page", () => {
  for (const [locale, label] of [["en", "Documentation"], ["ru", "Руководство"]] as const) {
    const h = header(help, locale);
    try {
      let links = h.tabs();
      assert.equal(links.length, 2);
      assert.equal(links[0].props.children, label);
      assert.equal(links[1].props.children, "Falcon AI");
      assert.equal(links[0].props["aria-current"], "page");
      assert.equal(links[1].props["aria-current"], undefined);
      h.visit(chatHref); links = h.tabs();
      assert.equal(links[0].props["aria-current"], undefined);
      assert.equal(links[1].props["aria-current"], "page");
    } finally { h.dispose(); }
  }
});

test("the Docs tab restores the visited article section and the AI tab restores its chat turn", () => {
  const h = header(`${help}&article=github#rules`);
  try {
    h.tabs(); h.visit(chatHref);
    const docs = h.tabs()[0], docsUrl = new URL(String(docs.props.href), help);
    assert.equal(docsUrl.searchParams.get("article"), "github");
    assert.equal(docsUrl.hash, "#rules");
    assert.equal(docsUrl.searchParams.get("workspaceId"), "w");
    assert.equal(docsUrl.searchParams.get("projectId"), "p");
    assert.equal(docsUrl.searchParams.has("chat"), false);
    const event = mouse(); invoke(docs, "onClick", event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(new URL(h.href()).hash, "#rules");
    invoke(h.tabs()[1], "onClick", mouse());
    assert.equal(new URL(h.href()).searchParams.get("chat"), chat);
    assert.equal(new URL(h.href()).searchParams.get("message"), turn);
    assert.equal(h.navigated(), 2);
  } finally { h.dispose(); }
});

test("modified and middle tab clicks retain browser link behavior and leave the current view open", () => {
  const h = header(chatHref);
  try {
    const docs = h.tabs()[0];
    for (const modifiers of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const event = mouse(modifiers); invoke(docs, "onClick", event);
      assert.equal(event.defaultPrevented, false);
      assert.equal(h.href(), chatHref);
      assert.equal(h.navigated(), 0);
    }
  } finally { h.dispose(); }
});

test("the AI header burger controls chat history with localized disclosure state", () => {
  for (const locale of ["en", "ru"] as const) for (const open of [false, true]) {
    const h = header(chatHref, locale, open);
    try {
      const burger = h.all().find(node => node.props["aria-controls"] === "falcon-ai-history")!;
      assert.ok(burger);
      assert.equal(burger.props["aria-expanded"], open);
      assert.equal(burger.props["aria-label"], open ? documentationCopy[locale].hideChatHistory : documentationCopy[locale].showChatHistory);
      invoke(burger, "onClick"); assert.equal(h.toggles(), 1);
    } finally { h.dispose(); }
  }
});
