import assert from "node:assert/strict";
import { test } from "node:test";
import { guideChatLink, readGuideChatRoute, preserveGuideChatRoute } from "../../navigation/chat-link";
import { buildWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";

const chatId = "94e3be6c-8fc9-48a9-b4c4-4d5e98e0c040";
const turnId = "9302bbdf-79bb-4528-9d03-694064432151";
const shareId = "973dcc31-92c6-496e-a932-964ac8cb4e14";
const origin = "https://tms.example/work/?workspaceId=w&projectId=p&view=runs&runId=old#old";

test("private chat and answer links preserve workspace context without stale screen parameters", () => {
  const href = guideChatLink(origin, { chatId, turnId });
  assert.deepEqual(readGuideChatRoute(new URL(href, origin).href), { chatId, turnId, shareId: null });
  const query = new URL(href, origin).searchParams;
  assert.equal(query.get("view"), "help"); assert.equal(query.get("article"), "falcon-ai-chat");
  assert.equal(query.get("workspaceId"), "w"); assert.equal(query.get("runId"), null);
  assert.equal(new URL(href, origin).hash, "");
});

test("shared links contain no private chat identifiers and malformed routes are rejected", () => {
  const href = guideChatLink(origin, { shareId });
  assert.deepEqual(readGuideChatRoute(new URL(href, origin).href), { chatId: null, turnId: null, shareId });
  assert.equal(new URL(href, origin).searchParams.has("projectId"), false);
  const canonical = new URL(buildWorkspaceDeepLink(new URL(href, origin).href, { workspaceId: "w", projectId: "other", view: "help", runId: null }));
  assert.equal(canonical.searchParams.has("projectId"), false);
  for (const query of ["chat=../private&message=x", `message=${turnId}`, `chat=${chatId}&share=${shareId}`]) {
    const route = readGuideChatRoute(`https://tms.example/work/?view=help&article=falcon-ai-chat&${query}`);
    assert.equal(route.chatId, null); assert.equal(route.turnId, null);
  }
});

test("workspace canonicalization retains guide routes only in their workspace and Help", () => {
  const href = new URL(guideChatLink(origin, { chatId, turnId }), origin).href;
  const scope = { workspaceId: "w", projectId: "p", view: "help" as const, runId: null };
  assert.equal(new URL(buildWorkspaceDeepLink(href, scope)).searchParams.get("chat"), chatId);
  assert.equal(new URL(buildWorkspaceDeepLink(href, { ...scope, projectId: "other" })).searchParams.get("message"), turnId);
  for (const next of [{ ...scope, workspaceId: "other" }, { ...scope, view: "cases" as const }]) {
    assert.equal(new URL(buildWorkspaceDeepLink(href, next)).searchParams.has("chat"), false);
  }
  const target = new URL("https://tms.example/work/?view=help&article=introduction");
  preserveGuideChatRoute(href, target); assert.equal(target.searchParams.has("chat"), false);
});
