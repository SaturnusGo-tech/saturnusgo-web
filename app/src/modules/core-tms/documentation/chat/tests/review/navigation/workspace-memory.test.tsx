import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useDocumentationNavigation } from "../../../../navigation/useDocumentationNavigation";
import { useGuideChatRoute } from "../../../navigation/useGuideChatRoute";

Object.assign(globalThis, { React });
const chatId = "94e3be6c-8fc9-48a9-b4c4-4d5e98e0c040";
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test("guide navigation remembers a chat across articles only inside its original workspace", async () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const browser = Object.assign(new EventTarget(), { location: {
    href: `https://tms.example/work/?workspaceId=a&projectId=p&view=help&article=falcon-ai-chat&chat=${chatId}`,
  } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  let navigation: ReturnType<typeof useDocumentationNavigation> | undefined;
  let route: ReturnType<typeof useGuideChatRoute> | undefined, tree: ReactTestRenderer | undefined;
  function Hook() { navigation = useDocumentationNavigation(); route = useGuideChatRoute(); return null; }
  async function visit(href: string) {
    await act(async () => { browser.location.href = href; browser.dispatchEvent(new Event("popstate")); await flush(); });
  }
  try {
    await act(async () => { tree = create(<Hook />); await flush(); });
    await visit("https://tms.example/work/?workspaceId=a&projectId=p&view=help&article=create-run");
    assert.equal(new URL(navigation?.link("falcon-ai-chat") ?? "", browser.location.href).searchParams.get("chat"), chatId);
    assert.equal(route?.chatId, chatId);
    await visit("https://tms.example/work/?workspaceId=b&projectId=other&view=help&article=create-run");
    const link = new URL(navigation?.link("falcon-ai-chat") ?? "", browser.location.href);
    assert.equal(link.searchParams.get("workspaceId"), "b"); assert.equal(link.searchParams.has("chat"), false);
    assert.equal(route?.chatId, null); assert.equal(route?.shareId, null);
  } finally {
    if (tree) act(() => tree?.unmount());
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow); else Reflect.deleteProperty(globalThis, "window");
  }
});
