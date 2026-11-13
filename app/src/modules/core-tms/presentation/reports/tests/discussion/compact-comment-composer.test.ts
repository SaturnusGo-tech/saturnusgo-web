import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { CaseCommentsSection } from "../../../cases/collaboration/comments/CaseCommentsTab";
import type { CaseCollaborationViewModel } from "../../../cases/collaboration/model";
import type { CommentDraft } from "../../../../test-cases/collaboration/model/drafts/comment-draft";
import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
import { commentFailureLabel } from "../../../cases/collaboration/failures/comment-failure";
import type { DefectDiscussion } from "../../detail/discussion/DefectDiscussion";

function setup(compactComposer = true) {
  const h = componentHarness();
  const comment = { id: "comment", body: "Original **report**", createdAt: "2026-11-13T09:00:00Z",
    author: { identityId: "author", displayName: "Reporter" } } as TestCaseComment;
  const model = { comments: { status: "ready", items: [comment] }, commentProjectId: "project", canComment: true,
    commentSubmitting: false, changingCommentId: null, commentFailure: null, addComment: async () => false } as unknown as CaseCollaborationViewModel;
  const { CaseCommentsSection: Section } = h.load<{ CaseCommentsSection: typeof CaseCommentsSection }>(
    new URL("../../../cases/collaboration/comments/CaseCommentsTab.tsx", import.meta.url), name => {
      if (name.endsWith("useCommentAncestors")) return { useCommentAncestors() {} };
      if (name.endsWith("useCommentNavigation")) return { useCommentNavigation: () => ({ failedId: null, reveal() {} }) };
      if (name.endsWith("comment-tree")) return { commentTree: (items: TestCaseComment[]) => items.map(value => ({ comment: value, children: [] })) };
      if (name.endsWith("model")) return { commentFailureLabel };
      return undefined;
    });
  const input = { caseId: "defect-a", locale: "en" as const, languageTag: "en-US", compactComposer, model };
  const render = () => nodes(h.render(() => Section(input)));
  const open = () => { invoke(render().find(node => node.type === "CompactCommentPrompt")!, "onOpen"); return render(); };
  render();
  return { h, model, input, comment, render, open };
}

test("compact composition is opt-in while case comments retain their rich editor", () => {
  const compact = setup(); const tree = compact.render();
  assert.ok(tree.some(node => node.type === "CompactCommentPrompt"));
  assert.ok(!tree.some(node => node.type === "CommentComposer")); compact.h.dispose();
  const regular = setup(false);
  assert.ok(regular.render().some(node => node.type === "CommentComposer"));
  assert.ok(!regular.render().some(node => node.type === "CompactCommentPrompt")); regular.h.dispose();
});

test("opening retains the existing persistent rich editor and failures preserve its draft instance", async () => {
  const f = setup(); const initial = f.open().find(node => node.type === "CommentComposer")!;
  assert.equal(initial.props.persistent, true); assert.equal(initial.props.autoFocus, true); assert.equal(initial.props.projectId, "project");
  const calls: unknown[] = [];
  f.model.addComment = async (...args) => { calls.push(args); return false; };
  const draft: CommentDraft = { body: "**Formatted** report with private evidence", parentId: null,
    mentions: ["member"], notifyChannels: ["slack"] };
  assert.equal(await invoke(f.render().find(node => node.type === "CommentComposer")!, "onSubmit", draft), false);
  f.model.commentFailure = "channel_unavailable";
  const failed = f.render().find(node => node.type === "CommentComposer")!;
  assert.equal(failed.key, initial.key); assert.equal(failed.props.failure, commentFailureLabel("en", "channel_unavailable"));
  assert.equal((calls[0] as unknown[])[0], draft.body); assert.equal((calls[0] as unknown[])[1], draft);
  assert.ok(!f.render().some(node => node.type === "CompactCommentPrompt")); f.h.dispose();
});

test("reply opens composition and clearing the recipient keeps the rich draft mounted", () => {
  const f = setup(); invoke(f.render().find(node => node.type === "CommentThread")!, "onReply", f.comment);
  const reply = f.render().find(node => node.type === "CommentComposer")!;
  assert.equal(reply.props.reply, f.comment);
  invoke(reply, "onClearReply");
  const cleared = f.render().find(node => node.type === "CommentComposer")!;
  assert.equal(cleared.key, reply.key); assert.equal(cleared.props.reply, undefined);
  assert.ok(!f.render().some(node => node.type === "CompactCommentPrompt")); f.h.dispose();
});

test("pending submissions retain composition and only successful completion collapses it", async () => {
  const f = setup(); let finish!: (ok: boolean) => void;
  f.model.addComment = () => new Promise(resolve => { finish = resolve; });
  const initial = f.open().find(node => node.type === "CommentComposer")!;
  const pending = invoke(initial, "onSubmit", { body: "Draft" }) as Promise<boolean>;
  f.model.commentSubmitting = true;
  assert.equal(f.render().find(node => node.type === "CommentComposer")?.props.pending, true);
  assert.ok(!f.render().some(node => node.type === "CompactCommentPrompt"));
  finish(true); assert.equal(await pending, true); f.model.commentSubmitting = false;
  assert.ok(f.render().some(node => node.type === "CompactCommentPrompt"));
  const next = f.open().find(node => node.type === "CommentComposer")!;
  assert.notEqual(next.key, initial.key); f.h.dispose();
});

test("switching defects resets composition and an earlier completion cannot collapse a new draft", async () => {
  for (const returnToOriginal of [false, true]) {
    const f = setup(); let finish!: (ok: boolean) => void;
    f.model.addComment = () => new Promise(resolve => { finish = resolve; });
    const pending = invoke(f.open().find(node => node.type === "CommentComposer")!, "onSubmit", { body: "Old draft" }) as Promise<boolean>;
    f.input.caseId = "defect-b"; f.render();
    assert.ok(f.render().some(node => node.type === "CompactCommentPrompt"));
    if (returnToOriginal) { f.input.caseId = "defect-a"; f.render(); f.render(); }
    const next = f.open().find(node => node.type === "CommentComposer")!;
    finish(true); await pending;
    assert.equal(f.render().find(node => node.type === "CommentComposer")?.key, next.key); f.h.dispose();
  }
});

test("comment permissions and ready status gate the compact prompt and full editor", () => {
  const f = setup(); f.model.canComment = false;
  assert.ok(!f.render().some(node => ["CommentComposer", "CompactCommentPrompt"].includes(node.type)));
  f.model.canComment = true;
  for (const status of ["loading", "unavailable", "error"] as const) {
    f.model.comments.status = status;
    assert.ok(!f.render().some(node => ["CommentComposer", "CompactCommentPrompt"].includes(node.type)));
  }
  f.h.dispose();
});

test("only defect discussion explicitly enables compact composition", () => {
  const h = componentHarness();
  const { DefectDiscussion: Discussion } = h.load<{ DefectDiscussion: typeof DefectDiscussion }>(
    new URL("../../detail/discussion/DefectDiscussion.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", languageTag: "en-US" }) };
      if (name.endsWith("useCaseCollaboration")) return { useCaseCollaboration: () => ({}) };
      return undefined;
    });
  const section = nodes(h.render(() => Discussion({ defectId: "bug", projectId: "project", connected: true, canComment: true })))[0];
  assert.equal(section.props.compactComposer, true); assert.equal(section.key, "bug"); h.dispose();
});

test("compact prompt uses the shared orb, localized button label and accessible disabled state", () => {
  const h = componentHarness(); let opened = false;
  const { CompactCommentPrompt: Prompt } = h.load<{ CompactCommentPrompt: (props: { ru: boolean; disabled: boolean; onOpen: () => void }) => unknown }>(
    new URL("../../../cases/collaboration/comments/compact/CompactCommentPrompt.tsx", import.meta.url));
  for (const ru of [false, true]) {
    const tree = nodes(h.render(() => Prompt({ ru, disabled: true, onOpen: () => { opened = true; } })));
    const button = tree.find(node => node.type === "Button")!;
    assert.equal(button.props["aria-label"], ru ? "Написать комментарий…" : "Write a comment…");
    assert.equal(button.props.isDisabled, true); assert.equal(button.props["aria-expanded"], false);
    assert.ok(tree.some(node => node.type === "LoadingOrb"));
  }
  assert.equal(opened, false); h.dispose();
});

test("compact autofocus reaches the lazy Markdown editor without changing persistent case defaults", () => {
  const h = componentHarness();
  const { CommentComposer: Composer } = h.load<{ CommentComposer: (props: {
    ru: boolean; pending: boolean; failure: string; persistent: boolean; autoFocus?: boolean;
    onSubmit: () => Promise<boolean>; onCancel: () => void;
  }) => unknown }>(new URL("../../../cases/collaboration/composer/CommentComposer.tsx", import.meta.url), name => {
    if (name.endsWith("comment-attachments")) return { readCommentAttachments: () => ({ text: "", attachments: [] }),
      writeCommentAttachments: (body: string) => body };
    if (name.endsWith("useCommentAttachments")) return { useCommentAttachments: () => ({ references: [] }) };
    if (name.endsWith("WorkspaceConnectorContext")) return { useWorkspaceConnectors: () => ({ connections: [] }) };
    return undefined;
  });
  for (const autoFocus of [true, undefined]) {
    const tree = nodes(h.render(() => Composer({ ru: false, pending: false, failure: "", persistent: true, autoFocus,
      onSubmit: async () => false, onCancel() {} })));
    assert.equal(tree.find(node => node.type === "MarkdownField")?.props.autoFocus, Boolean(autoFocus));
  }
  h.dispose();
});
