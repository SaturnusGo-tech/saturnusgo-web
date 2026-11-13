import test from "node:test";
import assert from "node:assert/strict";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { useFormLeave } from "../../../../authoring/leave/state/value/useFormLeave";
import type { CommentComposer } from "../../../../presentation/cases/collaboration/composer/CommentComposer";

function fixture() {
  const h = componentHarness(); let session: { dirty: boolean; busy?: boolean } | undefined;
  let approved = false, canceled = 0, released = 0, succeeds = false;
  const { useFormLeave: useLeave } = h.load<{ useFormLeave: typeof useFormLeave }>(new URL("../../../../authoring/leave/state/value/useFormLeave.ts", import.meta.url), name => {
    if (name.endsWith("useAuthoringSession")) return { useAuthoringSession: (next: typeof session) => {
      session = next; return { release: () => { released++; } };
    } };
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: async (action: () => void) => {
      if (session?.busy || (session?.dirty && !approved)) return false; action(); return true;
    } };
    return undefined;
  });
  const { CommentComposer: View } = h.load<{ CommentComposer: typeof CommentComposer }>(new URL("../../../../presentation/cases/collaboration/composer/CommentComposer.tsx", import.meta.url), name => {
    if (name.endsWith("useFormLeave")) return { useFormLeave: useLeave };
    if (name.endsWith("WorkspaceConnectorContext")) return { useWorkspaceConnectors: () => ({ connections: [] }) };
    if (name.endsWith("useCommentAttachments")) return { useCommentAttachments: () => ({ references: [], entries: [], blocked: false, uploading: false }) };
    if (name.endsWith("comment-attachments")) return { readCommentAttachments: () => ({ text: "Original", attachments: [] }), writeCommentAttachments: (text: string) => text };
    return undefined;
  });
  return { h, render: () => nodes(h.render(() => View({ ru: false, pending: false, failure: "", initial: { mentions: [] } as never,
    onSubmit: async () => succeeds, onCancel: () => { canceled++; } }))), session: () => session,
    canceled: () => canceled, released: () => released, approve: () => { approved = true; }, success: () => { succeeds = true; } };
}

test("edited comment asks before cancel; a reverted comment is clean", async t => {
  const f = fixture(); t.after(() => f.h.dispose());
  assert.ok(f.render()); assert.equal(f.session()?.dirty, false);
  invoke(f.render().find(node => node.type === "MarkdownField")!, "onChange", "Changed");
  f.render(); assert.equal(f.session()?.dirty, true);
  await invoke(f.render().find(node => node.type === "button" && node.props.children === "Cancel")!, "onClick");
  assert.equal(f.canceled(), 0);
  f.approve(); await invoke(f.render().find(node => node.type === "button" && node.props.children === "Cancel")!, "onClick");
  assert.equal(f.canceled(), 1);
  invoke(f.render().find(node => node.type === "MarkdownField")!, "onChange", "Original");
  f.render(); assert.equal(f.session()?.dirty, false);
});

test("failed posting retains protection; successful posting releases it", async t => {
  const f = fixture(); t.after(() => f.h.dispose());
  invoke(f.render().find(node => node.type === "MarkdownField")!, "onChange", "Changed");
  await invoke(f.render().find(node => node.type === "button" && node.props.className === "send")!, "onClick");
  await new Promise(setImmediate);
  f.render(); assert.equal(f.session()?.dirty, true); assert.equal(f.released(), 0);
  f.success(); await invoke(f.render().find(node => node.type === "button" && node.props.className === "send")!, "onClick");
  await new Promise(setImmediate); assert.equal(f.released(), 1);
});
