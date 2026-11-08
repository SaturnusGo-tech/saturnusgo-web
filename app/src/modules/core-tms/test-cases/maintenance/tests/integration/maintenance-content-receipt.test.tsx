import assert from "node:assert/strict";
import test from "node:test";
import type { TestCase } from "../../../../../../core/tms/contracts/legacy-contract";
import { resolvePendingOperation } from "../../../../../../core/tms/idempotency/pending-operation";
import { createEmptyRevision, normalizeRevisionTags } from "../../../../helpers/cases/caseRevision";
import * as pendingCaseAttachment from "../../../../application/evidence/case/pendingCaseAttachment";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import type { useCaseActions } from "../../../../state/case-actions/useCaseActions";
import { reconcileMaintenance, type CaseMaintenance } from "../../model/case-maintenance";

test("a delayed content-save receipt accepts the saved revision without reverting confirmed maintenance", async () => {
  const h = componentHarness();
  const initial: CaseMaintenance = { status: "current", rowVersion: 0, updatedBy: null, updatedAt: null, source: null, note: null, etag: "m0" };
  const marked: CaseMaintenance = { ...initial, status: "needs_update", rowVersion: 1, etag: "m1" };
  const original = { id: "a", projectId: "p", folderPath: "/", current: createEmptyRevision(), maintenance: initial } as TestCase;
  const saved = { ...original, title: "Saved revision", current: { ...original.current, title: "Saved revision" } };
  let finish!: (value: unknown) => void;
  const receipt = new Promise(resolve => { finish = resolve; });
  let detail: TestCase | null = original, items = [original];
  const module = h.load<{ useCaseActions: typeof useCaseActions }>(new URL("../../../../state/case-actions/useCaseActions.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("AttachmentClientProvider")) return { useAttachmentClient: () => ({}) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("caseRevision")) return { createEmptyRevision, normalizeRevisionTags };
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("pendingCaseAttachment")) return pendingCaseAttachment;
    if (name.endsWith("saveCaseWithAttachments")) return { saveCaseWithAttachments: () => receipt };
    if (name.endsWith("case-maintenance")) return { reconcileMaintenance };
    if (name.endsWith("useCaseDocumentation")) return { useCaseDocumentation: () => ({fields: {}, save: async () => true, reset() {}}) };
  });
  const state = { connection: "connected", editing: true, caseDraft: { ...original.current, title: "Saved revision" }, caseFolderPath: "/",
    data: { workspace: { id: "workspace" } },
    selectedCaseEtag: "content-1", beginCaseSubmission: () => true, finishCaseSubmission() {},
    setData: (update: (value: { testCases: TestCase[] }) => { testCases: TestCase[] }) => { items = update({ testCases: items }).testCases; },
    setSelectedCaseDetail: (update: TestCase | null | ((value: TestCase | null) => TestCase | null)) => { detail = typeof update === "function" ? update(detail) : update; },
    setSelectedCaseId() {}, setSelectedFolder() {}, setSelectedFolderId() {}, setSelectedCaseEtag() {}, setDialog() {} };
  const actions = h.render(() => module.useCaseActions(state as never, { project: { id: "p" }, selectedCase: original } as never, () => {}));
  const job = actions.saveCase({ preventDefault() {} } as never);
  detail = { ...original, maintenance: marked }; items = [detail];
  finish({ data: saved, etag: "content-2" }); await job;
  assert.equal(items[0].maintenance?.rowVersion, 1, "content receipts cannot reset the repository filter projection");
  assert.equal(detail?.maintenance?.rowVersion, 1, "content receipts cannot reset the header projection");
  assert.equal(detail?.current, saved.current); assert.equal(items[0].title, saved.title);
  h.dispose();
});
