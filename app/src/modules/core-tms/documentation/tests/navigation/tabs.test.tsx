import assert from "node:assert/strict";
import test from "node:test";
import React, { type MouseEvent } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";

Object.assign(globalThis, { React });
const chat = "94e3be6c-8fc9-48a9-b4c4-4d5e98e0c040";
const turn = "b1e5a4d8-8ab8-4b52-9455-4899206a941f";
const share = "8bd4a66a-c979-4917-a412-c1320662bfbd";
const help = "https://tms.example/work/?workspaceId=w&projectId=p&view=help";

async function withNavigation(href: string, run: (browser: ReturnType<typeof createBrowser>, current: () => ReturnType<typeof useDocumentationNavigation>, owner: (id: string) => void) => void | Promise<void>) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  const browser = createBrowser(href);
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  let navigation!: ReturnType<typeof useDocumentationNavigation>, tree!: ReactTestRenderer;
  function Hook({ identity = "owner" }: { identity?: string }) { navigation = useDocumentationNavigation(identity); return null; }
  try {
    act(() => { tree = create(<Hook />); });
    await run(browser, () => navigation, (identity) => act(() => tree.update(<Hook identity={identity} />)));
  } finally {
    act(() => tree?.unmount());
    if (previous) Object.defineProperty(globalThis, "window", previous); else Reflect.deleteProperty(globalThis, "window");
  }
}

function createBrowser(href: string) {
  const browser = Object.assign(new EventTarget(), {
    location: new URL(href),
    sessionStorage: { getItem: (_key: string) => null, setItem: (_key: string, _value: string) => {} },
    history: { state: null as unknown, pushState, replaceState: pushState },
    visit(href: string, event = "popstate") {
      act(() => { browser.location = new URL(href, browser.location.href); browser.dispatchEvent(new Event(event)); });
    },
  });
  function pushState(state: unknown, _title: string, href: string) { browser.history.state = state; browser.location = new URL(href, browser.location.href); }
  return browser;
}

function click(navigation: ReturnType<typeof useDocumentationNavigation>, id: string, section?: string) {
  const event = { button: 0, preventDefault() {}, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false } as MouseEvent<HTMLAnchorElement>;
  act(() => navigation.navigate(event, id, section));
}

test("bare help opens docs and an explicit chat deep link remains selected", async () => {
  await withNavigation(help, (browser, current) => {
    assert.equal(current().articleId, "introduction");
    browser.visit(`${help}&article=falcon-ai-chat&chat=${chat}&message=${turn}`);
    assert.equal(current().articleId, "falcon-ai-chat");
    const target = new URL(current().link("falcon-ai-chat"), browser.location.href);
    assert.equal(target.searchParams.get("chat"), chat);
    assert.equal(target.searchParams.get("message"), turn);
  });
});

test("tab round trip restores the last article section and the selected chat turn", async () => {
  await withNavigation(`${help}&article=falcon-ai-chat&chat=${chat}&message=${turn}`, (browser, current) => {
    click(current(), "create-run", "builds");
    click(current(), "falcon-ai-chat");
    assert.equal(browser.location.searchParams.get("chat"), chat);
    assert.equal(browser.location.searchParams.get("message"), turn);
    browser.visit(`${help.replace("projectId=p", "projectId=next")}&article=falcon-ai-chat&chat=${chat}&message=${turn}`);
    click(current(), current().documentationId, current().documentationSection);
    assert.equal(browser.location.searchParams.get("article"), "create-run");
    assert.equal(browser.location.hash, "#builds");
    assert.equal(browser.location.searchParams.get("workspaceId"), "w");
    assert.equal(browser.location.searchParams.get("projectId"), "next");
    assert.equal(browser.location.searchParams.has("chat"), false);
  });
});

test("history and hash changes update the docs tab return target", async () => {
  await withNavigation(`${help}&article=github#rules`, (browser, current) => {
    browser.visit(`${help}&article=trello#webhook`);
    browser.visit(`${help}&article=github#rules`);
    assert.equal(current().documentationId, "github");
    assert.equal(current().documentationSection, "rules");
    browser.visit(`${help}&article=github#actions`, "hashchange");
    browser.visit(`${help}&article=falcon-ai-chat`);
    assert.equal(new URL(current().link(current().documentationId, current().documentationSection), help).hash, "#actions");
  });
});

test("workspace and identity changes reset remembered docs and private chats", async () => {
  await withNavigation(`${help}&article=falcon-ai-chat&chat=${chat}`, (browser, current, owner) => {
    browser.visit(`${help}&article=github#rules`);
    owner("other-owner");
    assert.equal(new URL(current().link("falcon-ai-chat"), help).searchParams.has("chat"), false);
    browser.visit(`${help}&article=falcon-ai-chat&chat=${chat}`);
    owner("third-owner");
    assert.equal(current().documentationId, "introduction");
    assert.equal(current().documentationSection, undefined);
    browser.visit("https://tms.example/work/?workspaceId=other&projectId=next&view=help&article=create-run#builds");
    const target = new URL(current().link("falcon-ai-chat"), help);
    assert.equal(target.searchParams.get("workspaceId"), "other");
    assert.equal(target.searchParams.get("projectId"), "next");
    assert.equal(target.searchParams.has("chat"), false);
    assert.equal(current().documentationId, "create-run");
    browser.visit("https://tms.example/work/?workspaceId=third&view=help&article=falcon-ai-chat");
    assert.equal(current().documentationId, "introduction");
    assert.equal(current().documentationSection, undefined);
  });
});

test("a shared chat deep link survives a docs round trip without gaining project scope", async () => {
  await withNavigation(`https://tms.example/work/?workspaceId=w&view=help&article=falcon-ai-chat&share=${share}`, (browser, current) => {
    click(current(), "github", "rules");
    click(current(), "falcon-ai-chat");
    assert.equal(browser.location.searchParams.get("share"), share);
    assert.equal(browser.location.searchParams.has("chat"), false);
    assert.equal(browser.location.searchParams.has("projectId"), false);
  });
});
