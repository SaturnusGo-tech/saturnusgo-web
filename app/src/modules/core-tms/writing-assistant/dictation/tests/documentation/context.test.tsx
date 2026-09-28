import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { hookHarness } from "../state/hook-harness";
import { browserHarness } from "../support/browser";
import { useWritingDictation } from "../../state/useWritingDictation";

test("guide dictation uses the read-authorized endpoint and only updates the draft", async (t) => {
  const h = hookHarness(t, { text: "Как", config: {
    purpose: "documentation", contextKey: "chat-a", maximumCharacters: 8000, target: undefined,
  } });
  await h.start(); h.samples(); await h.stop(); await h.reply("создать прогон?");
  assert.equal(h.requests[0].path, "/workspaces/workspace-a/ai/documentation-dictation");
  assert.equal(h.text(), "Как создать прогон?");
  assert.equal(h.applied(), 0);
});

test("new guide conversation cancels old transcription", async (t) => {
  const h = hookHarness(t, { text: "Draft", config: { purpose: "documentation", contextKey: "chat-a" } });
  await h.start(); h.samples(); await h.stop();
  h.update({ contextKey: "chat-b" });
  assert.equal(h.requests[0].signal?.aborted, true);
  await h.reply("Old conversation");
  assert.equal(h.text(), "Draft");
});

test("guide character limit preserves the complete transcript and prevents another recording", async (t) => {
  const h = hookHarness(t, { text: "x".repeat(7998), config: { purpose: "documentation", maximumCharacters: 8000 } });
  await h.start(); h.samples(); await h.stop(); await h.reply("more words");
  assert.equal(h.text(), `${"x".repeat(7998)} more words`);
  assert.match(h.get().notice, /8\s000/);
  const count = h.browser.contexts.length;
  await h.start();
  assert.equal(h.browser.contexts.length, count);
  assert.match(h.get().error, /Сократите/);
});

test("static guide without an HTTP provider remains renderable and cannot start capture", (t) => {
  const browser = browserHarness(); browser.install(t);
  let state!: ReturnType<typeof useWritingDictation>;
  function Probe() {
    state = useWritingDictation({ instruction: "", onChange() {}, ru: true, enabled: false,
      workspaceId: "", purpose: "documentation" });
    return null;
  }
  let tree!: ReturnType<typeof create>;
  act(() => { tree = create(<Probe />); });
  act(() => state.start());
  assert.equal(state.state, "idle");
  assert.equal(browser.contexts.length, 0);
  act(() => tree.unmount());
});
