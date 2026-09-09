import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../tests/support/component-harness";
import { resolvePendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { mergeDiscussionComments } from "../application/merge-comments";
import type { usePortfolioCommand } from "../../state/command/usePortfolioCommand";
import type { useDiscussion } from "../state/useDiscussion";
import type { OrganizationComment } from "../model/discussion";

const comment = { id: "comment", body: "Проверим оплату", author: { identityId: "author", displayName: "Мария" }, createdAt: "2026-09-09T12:00:00Z" };
function setup(post: (body: string, key: string, signal: AbortSignal) => Promise<OrganizationComment>) {
  const h = componentHarness(); let reloads = 0;
  const command = h.load<{ usePortfolioCommand: typeof usePortfolioCommand }>(new URL("../../state/command/usePortfolioCommand.ts", import.meta.url), (name) => {
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("mutation-failure")) return { toTmsMutationFailure };
  });
  const hook = h.load<{ useDiscussion: typeof useDiscussion }>(new URL("../state/useDiscussion.ts", import.meta.url), (name) => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("useCatalogPage")) return { useCatalogPage: () => ({ items: [], reload: () => { reloads++; } }) };
    if (name.endsWith("usePortfolioCommand")) return command;
    if (name.endsWith("discussion-api")) return { postDiscussion: (_http: unknown, _scope: unknown, body: string, key: string, signal: AbortSignal) => post(body, key, signal) };
    if (name.endsWith("merge-comments")) return { mergeDiscussionComments };
  });
  return { ...h, reloads: () => reloads, renderDiscussion: (id = "one", canPost = true) => h.render(() => hook.useDiscussion({ workspaceId: "workspace", targetType: "project", targetId: id }, canPost)) };
}

test("failed comment retry retains its operation key and shows only confirmed posts", async () => {
  const keys: string[] = []; const h = setup(async (_body, key) => {
    keys.push(key); if (keys.length === 1) throw new Error("Network interrupted"); return comment;
  });
  assert.equal(await h.renderDiscussion().post(comment.body), false);
  assert.equal(h.renderDiscussion().items.length, 0);
  assert.equal(await h.renderDiscussion().post(comment.body), true);
  assert.equal(keys[0], keys[1]);
  assert.equal(h.renderDiscussion().items.length, 1); assert.equal(h.reloads(), 1);
});

test("changing the project aborts an outstanding post and suppresses late publication", async () => {
  let resolve!: (comment: OrganizationComment) => void;
  let signal: AbortSignal | undefined;
  const h = setup((_body, _key, activeSignal) => { signal = activeSignal; return new Promise((done) => { resolve = done; }); });
  const pending = h.renderDiscussion("old").post(comment.body);
  h.renderDiscussion("new");
  assert.equal(signal?.aborted, true);
  resolve(comment); assert.equal(await pending, false);
  assert.equal(h.renderDiscussion("new").items.length, 0); assert.equal(h.reloads(), 0);
});

test("read-only discussion and blank text cannot issue a write", async () => {
  let calls = 0; const h = setup(async () => { calls++; return comment; });
  assert.equal(await h.renderDiscussion("one", false).post(comment.body), false);
  assert.equal(await h.renderDiscussion().post("  "), false);
  assert.equal(calls, 0);
});
