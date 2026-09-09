import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../tests/support/component-harness";
import { toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import type { useOrganizationAttachments } from "../state/useOrganizationAttachments";
import type { AttachmentMetadata } from "../../../attachments/domain/attachment";
import { mergeOrganizationAttachments } from "../application/merge-attachments";
const file = new File(["test"], "plan.txt", { type: "text/plain" });
const metadata = { id: "a", status: "ready" } as AttachmentMetadata;
function setup(upload: (key: string, signal: AbortSignal) => Promise<AttachmentMetadata[]>) {
  const h = componentHarness(); let reloads = 0; let items: AttachmentMetadata[] = [];
  const hooks = h.load<{ useOrganizationAttachments: typeof useOrganizationAttachments }>(new URL("../state/useOrganizationAttachments.ts", import.meta.url), (name) => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("AttachmentClientProvider")) return { useAttachmentClient: () => ({}) };
    if (name.endsWith("useCatalogPage")) return { useCatalogPage: () => ({ items, reload: () => { reloads++; } }) };
    if (name.endsWith("merge-attachments")) return { mergeOrganizationAttachments };
    if (name.endsWith("mutation-failure")) return { toTmsMutationFailure };
    if (name.endsWith("uploadEvidence")) return { uploadEvidence: (input: { operationKeyPrefix: string; signal: AbortSignal }) => upload(input.operationKeyPrefix, input.signal) };
  });
  return { ...h, setItems: (value: AttachmentMetadata[]) => { items = value; }, reloads: () => reloads, run: (id = "one", allowed = true) => h.render(() => hooks.useOrganizationAttachments({ workspaceId: "workspace", targetType: "portfolio", targetId: id }, true, allowed)) };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
test("failed upload retains its per-file operation key and completed files remain visible through refresh", async () => {
  const keys: string[] = []; const h = setup(async (key) => { keys.push(key); if (keys.length === 1) throw new Error("Network"); return [metadata]; });
  h.run().add([file]); await flush();
  let state = h.run(); assert.equal(state.uploads[0].phase, "failed"); assert.equal(state.items.length, 0);
  state.retry(state.uploads[0]); await flush(); state = h.run();
  assert.equal(keys[0], keys[1]); assert.equal(state.uploads.length, 0); assert.equal(state.items[0].id, "a"); assert.equal(h.reloads(), 1);
});
test("navigation aborts upload and ignores its late result", async () => {
  let resolve!: (items: AttachmentMetadata[]) => void; let signal!: AbortSignal;
  const h = setup((_key, current) => { signal = current; return new Promise((done) => { resolve = done; }); });
  h.run().add([file]); h.run("two"); assert.equal(signal.aborted, true);
  resolve([metadata]); await flush(); const state = h.run("two");
  assert.equal(state.items.length, 0); assert.equal(state.uploads.length, 0); assert.equal(h.reloads(), 0);
});
test("read-only and revoked permissions do not launch uploads", async () => {
  let calls = 0; const h = setup(async () => { calls++; return [metadata]; });
  h.run("one", false).add([file]); await flush(); assert.equal(calls, 0);
  let signal!: AbortSignal;
  const pending = setup((_key, value) => { signal = value; return new Promise(() => {}); });
  pending.run().add([file]); pending.run("one", false); assert.equal(signal.aborted, true);
  assert.equal(pending.run("one", false).uploads.length, 0);
  pending.dispose();
});

test("authoritative deletion retires confirmed uploads instead of resurrecting stale ready metadata", async () => {
  const h = setup(async () => [metadata]); h.run().add([file]); await flush();
  assert.equal(h.run().items.length, 1);
  h.setItems([{ ...metadata, status: "deleting" }]); assert.equal(h.run().items.length, 0);
  h.setItems([]); assert.equal(h.run().items.length, 0);
});
