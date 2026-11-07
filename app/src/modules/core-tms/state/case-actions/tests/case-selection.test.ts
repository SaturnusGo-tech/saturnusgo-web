import assert from "node:assert/strict";
import test from "node:test";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import * as mutationFailure from "../../../../../core/tms/errors/mutation-failure";
import type { TestCase } from "../../../../../core/tms/contracts/legacy-contract";
import { resolvePendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { createEmptyRevision, normalizeRevisionTags } from "../../../helpers/cases/caseRevision";
import { saveCaseWithAttachments } from "../../../application/evidence/case/save/saveCaseWithAttachments";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";
import type { useCaseActions } from "../useCaseActions";
import type { useCaseEditorState } from "../../case-editor/useCaseEditorState";
import { reconcileMaintenance } from "../../../test-cases/maintenance/model/case-maintenance";

function setup(saveError?: TmsApiError) {
  const notices: string[] = [];
  let failure = saveError;
  const h = componentHarness(undefined, { structuredClone });
  const original = { id: "case-original", projectId: "project", folderPath: "/Login", folderId: "login", current: createEmptyRevision() } as TestCase;
  const created = { ...original, id: "case-created", current: { ...original.current, title: "New scenario" } };
  let selectedId = original.id, detail: TestCase | null = original, etag: string | null = '"original:1"', dialog: string | null = null;
  let projectId = "project", items = [original];
  const editor = h.load<{ useCaseEditorState: typeof useCaseEditorState }>(new URL("../../case-editor/useCaseEditorState.ts", import.meta.url), name => {
    if (name.endsWith("caseRevision")) return { createEmptyRevision };
  });
  const save = async () => {
    if (failure) throw failure;
    return { data: created, etag: '"created:1"' };
  };
  const actions = h.load<{ useCaseActions: typeof useCaseActions }>(new URL("../useCaseActions.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("AttachmentClientProvider")) return { useAttachmentClient: () => ({}) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("caseRevision")) return { createEmptyRevision, normalizeRevisionTags };
    if (name.endsWith("mutation-failure")) return mutationFailure;
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("case-maintenance")) return { reconcileMaintenance };
    if (name.endsWith("pendingCaseAttachment")) return { pendingCaseAttachmentSignature: () => "" };
    if (name.endsWith("saveCaseWithAttachments")) return { saveCaseWithAttachments };
    if (name.endsWith("test-case-api")) return { createTestCase: save, reviseTestCase: save, getTestCase: save };
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
    return { state, actions: actions.useCaseActions(state as never, derived as never, (message) => notices.push(message)) };
  });
  return { original, created, render, notices, allowSave() { failure = undefined; }, selection: () => ({ selectedId, detail, etag, dialog }),
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


test("create and revision keep their draft open on required field validation and can retry", async () => {
  for (const mode of ["create", "edit"]) {
    const f = setup(new TmsApiError("Test-case input is invalid.", 400, null, "VALIDATION_ERROR",
      "customFields", { field: "customFields", reason: "requiredCustomField" }));
    const actions = f.render().actions;
    if (mode === "create") actions.openNewCase();
    else actions.openEditCase();
    const draft = { ...f.render().state.caseDraft, title: "Unsubmitted scenario" };
    f.render().state.setCaseDraft(draft);
    await f.render().actions.saveCase({ preventDefault() {} } as never);
    assert.equal(f.render().actions.caseRequiredFields, true, mode);
    assert.equal(f.render().state.caseDraft, draft, mode);
    assert.equal(f.selection().dialog, "case", mode);
    assert.deepEqual(f.notices, [], mode);

    f.allowSave();
    await f.render().actions.saveCase({ preventDefault() {} } as never);
    assert.equal(f.render().actions.caseRequiredFields, false, mode);
    assert.equal(f.selection().dialog, null, mode);
    f.dispose();
  }
});
