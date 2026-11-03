import assert from "node:assert/strict";
import test from "node:test";
import type { TestCase } from "../../../../../core/tms/contracts/legacy-contract";
import { resolvePendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { createEmptyRevision, normalizeRevisionTags } from "../../../helpers/cases/caseRevision";
import { saveCaseWithAttachments } from "../../../application/evidence/case/save/saveCaseWithAttachments";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";
import type { useCaseActions } from "../useCaseActions";
import type { useCaseEditorState } from "../../case-editor/useCaseEditorState";
import { reconcileMaintenance } from "../../../test-cases/maintenance/model/case-maintenance";

function setup() {
  const h = componentHarness(undefined, { structuredClone });
  const original = { id: "case-original", projectId: "project", folderPath: "/Login", folderId: "login", current: createEmptyRevision() } as TestCase;
  const created = { ...original, id: "case-created", current: { ...original.current, title: "New scenario" } };
  let selectedId = original.id, detail: TestCase | null = original, etag: string | null = '"original:1"', dialog: string | null = null;
  let projectId = "project", items = [original];
  const editor = h.load<{ useCaseEditorState: typeof useCaseEditorState }>(new URL("../../case-editor/useCaseEditorState.ts", import.meta.url), name => {
    if (name.endsWith("caseRevision")) return { createEmptyRevision };
  });
  const actions = h.load<{ useCaseActions: typeof useCaseActions }>(new URL("../useCaseActions.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("AttachmentClientProvider")) return { useAttachmentClient: () => ({}) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("caseRevision")) return { createEmptyRevision, normalizeRevisionTags };
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("case-maintenance")) return { reconcileMaintenance };
    if (name.endsWith("pendingCaseAttachment")) return { pendingCaseAttachmentSignature: () => "" };
    if (name.endsWith("saveCaseWithAttachments")) return { saveCaseWithAttachments };
    if (name.endsWith("test-case-api")) return { createTestCase: async () => ({ data: created, etag: '"created:1"' }), getTestCase: async () => ({ data: created, etag: '"created:1"' }) };
  });
  const render = () => h.render(() => {
    const state = { ...editor.useCaseEditorState("en", () => { dialog = null; }), connection: "connected", selectedFolder: "/Login",
      selectedCaseId: selectedId, selectedCaseDetail: detail, selectedCaseEtag: etag,
      setSelectedCaseId: (id: string) => { selectedId = id; }, setSelectedCaseDetail: (value: TestCase | null | ((current: TestCase | null) => TestCase | null)) => { detail = typeof value === "function" ? value(detail) : value; },
      setSelectedCaseEtag: (value: string | null) => { etag = value; }, setSelectedFolder() {}, setSelectedFolderId() {},
      setDialog: (value: string | null) => { dialog = value; },
      setData: (update: (data: { testCases: TestCase[] }) => { testCases: TestCase[] }) => { items = update({ testCases: items }).testCases; },
    };
    const derived = { project: { id: projectId }, projectCases: items, selectedCase: items.find(item => item.id === selectedId), selectedRevision: detail?.current };
    return { state, actions: actions.useCaseActions(state as never, derived as never, () => {}) };
  });
  return { original, created, render, selection: () => ({ selectedId, detail, etag, dialog }),
    leaveProject() { projectId = "other-project"; selectedId = ""; detail = null; etag = null; dialog = null; }, dispose: h.dispose };
}

test("new case cancellation preserves the selected case and its hydrated revision", () => {
  const f = setup(); f.render().actions.openNewCase("/Other");
  assert.equal(f.selection().dialog, "case");
  assert.equal(f.render().state.caseFolderPath, "/Other");
  f.render().state.resetCaseEditor("/Login");
  assert.deepEqual(f.selection(), { selectedId: f.original.id, detail: f.original, etag: '"original:1"', dialog: null });
  f.dispose();
});

test("a successful creation selects the returned case instead of restoring the previous selection", async () => {
  const f = setup(); f.render().actions.openNewCase();
  f.render().state.setCaseDraft({ ...createEmptyRevision(), title: "New scenario" });
  await f.render().actions.saveCase({ preventDefault() {} } as never);
  assert.deepEqual(f.selection(), { selectedId: f.created.id, detail: f.created, etag: '"created:1"', dialog: null });
  f.dispose();
});

test("cancelling a revision discards the draft without mutating the selected case", () => {
  const f = setup(); f.render().actions.openEditCase();
  f.render().state.setCaseDraft({ ...f.original.current, title: "Unsaved revision" });
  f.render().state.resetCaseEditor("/Login");
  assert.deepEqual(f.selection(), { selectedId: f.original.id, detail: f.original, etag: '"original:1"', dialog: null });
  assert.equal(f.original.current.title, ""); f.dispose();
});

test("resetting an abandoned draft after project navigation never revives the old selection", () => {
  const f = setup(); f.render().actions.openNewCase(); f.leaveProject();
  f.render().state.resetCaseEditor("/");
  assert.deepEqual(f.selection(), { selectedId: "", detail: null, etag: null, dialog: null });
  f.dispose();
});
