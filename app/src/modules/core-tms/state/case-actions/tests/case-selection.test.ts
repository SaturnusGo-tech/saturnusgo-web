import { commitCaseToWorkspace } from "../reconciliation/commit-case";
import { requestAuthoringLeave } from "../../../authoring/leave/application/authoring-leave";
import assert from "node:assert/strict";
import test from "node:test";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import * as mutationFailure from "../../../../../core/tms/errors/mutation-failure";
import type { TestCase } from "../../../../../core/tms/contracts/legacy-contract";
import { resolvePendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { createEmptyRevision, normalizeRevisionTags } from "../../../helpers/cases/caseRevision";
import { saveCaseWithAttachments } from "../../../application/evidence/case/save/saveCaseWithAttachments";
import * as pendingCaseAttachment from "../../../application/evidence/case/pendingCaseAttachment";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";
import type { useCaseActions } from "../useCaseActions";
import type { useCaseEditorState } from "../../case-editor/useCaseEditorState";
import { reconcileMaintenance } from "../../../test-cases/maintenance/model/case-maintenance";
import { createProductDocsApi } from "../../../product-docs/data/product-docs-api";
import { saveDraftRequirements } from "../../../product-docs/requirements/save/save-draft-requirements";
import { pastedCaseDocLinks } from "../../../product-docs/requirements/save/pasted/pasted-case-doc-links";
import { savePastedRequirements } from "../../../product-docs/requirements/save/pasted/save-pasted-requirements";
import { notifyCaseRequirementsChanged } from "../../../product-docs/requirements/save/case-requirements-events";
import type { useCaseDocumentation } from "../documentation/useCaseDocumentation";

function setup(saveError?: TmsApiError, link?: (path: string, method: string, body: unknown) => Promise<unknown>,
  read?: (path: string) => Promise<unknown>) {
  const notices: string[] = [];
  let caseWrites = 0;
  let failure = saveError;
  const h = componentHarness(undefined, { structuredClone });
  const original = { id: "case-original", projectId: "project", folderPath: "/Login", folderId: "login", current: createEmptyRevision() } as TestCase;
  const created = { ...original, id: "case-created", current: { ...original.current, title: "New scenario" } };
  let selectedId = original.id, detail: TestCase | null = original, etag: string | null = '"original:1"', dialog: string | null = null;
  let projectId = "project", items = [original];
  const editor = h.load<{ useCaseEditorState: typeof useCaseEditorState }>(new URL("../../case-editor/useCaseEditorState.ts", import.meta.url), name => {
    if (name.endsWith("caseRevision")) return { createEmptyRevision };
  });
  const save = async (input: { revision?: TestCase["current"] } = {}) => {
    caseWrites++;
    if (failure) throw failure;
    return { data: read && input.revision ? {...created, current: input.revision} : created, etag: '"created:1"' };
  };
  const documentation = h.load<{useCaseDocumentation: typeof useCaseDocumentation}>(new URL("../documentation/useCaseDocumentation.ts", import.meta.url), name => {
    if (name.endsWith("mutation-failure")) return mutationFailure;
    if (name.endsWith("product-docs-api")) return {createProductDocsApi};
    if (name.endsWith("save-draft-requirements")) return {saveDraftRequirements};
    if (name.endsWith("pasted-case-doc-links")) return {pastedCaseDocLinks};
    if (name.endsWith("save-pasted-requirements")) return {savePastedRequirements};
    if (name.endsWith("case-requirements-events")) return {notifyCaseRequirementsChanged};
  });
  const actions = h.load<{ useCaseActions: typeof useCaseActions }>(new URL("../useCaseActions.ts", import.meta.url), name => {
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({ mutate: link, getResource: read }) };
    if (name.endsWith("AttachmentClientProvider")) return { useAttachmentClient: () => ({}) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("caseRevision")) return { createEmptyRevision, normalizeRevisionTags };
    if (name.endsWith("mutation-failure")) return mutationFailure;
    if (name.endsWith("pending-operation")) return { resolvePendingOperation };
    if (name.endsWith("commit-case")) return { commitCaseToWorkspace };
    if (name.endsWith("case-maintenance")) return { reconcileMaintenance };
    if (name.endsWith("pendingCaseAttachment")) return pendingCaseAttachment;
    if (name.endsWith("saveCaseWithAttachments")) return { saveCaseWithAttachments };
    if (name.endsWith("test-case-api")) return {
      createTestCase: (_http: unknown, input: Parameters<typeof save>[0]) => save(input),
      reviseTestCase: (_http: unknown, _id: string, input: Parameters<typeof save>[0]) => save(input),
      getTestCase: () => save(),
    };
    if (name.endsWith("useCaseDocumentation")) return documentation;
  });
  const render = () => h.render(() => {
    const state = { ...editor.useCaseEditorState("en", () => { dialog = null; }), connection: "connected", selectedFolder: "/Login",
      data: {workspace: {id: "workspace"}},
      selectedCaseId: selectedId, selectedCaseDetail: detail, selectedCaseEtag: etag,
      setSelectedCaseId: (id: string) => { selectedId = id; }, setSelectedCaseDetail: (value: TestCase | null | ((current: TestCase | null) => TestCase | null)) => { detail = typeof value === "function" ? value(detail) : value; },
      setSelectedCaseEtag: (value: string | null) => { etag = value; }, setSelectedFolder() {}, setSelectedFolderId() {},
      setDialog: (value: string | null) => { dialog = value; },
      setData: (update: (data: { testCases: TestCase[] }) => { testCases: TestCase[] }) => { items = update({ testCases: items }).testCases; },
    };
    const derived = { project: { id: projectId }, projectCases: items, selectedCase: items.find(item => item.id === selectedId), selectedRevision: detail?.current };
    return { state, actions: actions.useCaseActions(state as never, derived as never, (message) => notices.push(message)) };
  });
  return { original, created, render, notices, writes: () => caseWrites, allowSave() { failure = undefined; }, selection: () => ({ selectedId, detail, etag, dialog }),
    leaveProject() { projectId = "other-project"; selectedId = ""; detail = null; etag = null; dialog = null; }, dispose: h.dispose };
}

test("a lost document link response resumes against the existing case and also attaches pasted links", async () => {
  const requests: Array<[string, string, unknown]> = [];
  let loseResponse = true;
  const f = setup(undefined, async (path, method, body) => {
    requests.push([path, method, body]);
    if (path.endsWith("/doc-two") && loseResponse) { loseResponse = false; throw new Error("Connection lost"); }
    return {};
  }, async () => ({data: {canEdit: true, requirements: [], nextCursor: null}}));
  const first = {docId: "doc-one", sectionId: "payment", title: "Bookings", sectionTitle: "Payment"};
  f.render().actions.openNewCase(undefined, first);
  assert.deepEqual(Array.from(f.render().actions.caseDocumentation), [first]);
  assert.equal(f.writes(), 0);
  f.render().state.setCaseDraft({ ...createEmptyRevision(), title: "Coverage",
    description: "[Rule](https://tms.example/work/?workspaceId=workspace&projectId=project&view=product-docs&docId=pasted)" });
  f.render().actions.setCaseDocumentation([first, {docId: "doc-two", sectionId: "policy", title: "Payments", sectionTitle: "Policy"}]);
  let released = 0;
  const submit = () => f.render().actions.saveCase({preventDefault() {}} as never, [], undefined, () => { released++; });
  await submit();
  assert.equal(f.selection().dialog, "case");
  assert.equal(f.render().actions.caseDocumentationRetry, true);
  assert.equal(released, 0, "an incomplete save retains unsaved protection");
  f.render().actions.setCaseDocumentation([first]);
  await submit();
  assert.equal(f.writes(), 1);
  assert.equal(released, 1, "only a fully saved case releases its authoring session");
  assert.equal(f.selection().dialog, null);
  const path = "/workspaces/workspace/projects/project/product-docs/cases/case-created/requirements";
  assert.deepEqual(requests, [
    [path + "/doc-one", "PUT", {sectionId: "payment"}],
    [path + "/doc-two", "PUT", {sectionId: "policy"}],
    [path + "/doc-two", "DELETE", undefined],
    [path + "/pasted", "PUT", {sectionId: null, preserveExisting: true}],
  ]);
  f.dispose();
});

test("saving a revision attaches authored Product Docs links and preserves existing requirements", async () => {
  const written = new Map<string, unknown>();
  const f = setup(undefined, async (path, _method, body) => {
    written.set(path.slice(path.lastIndexOf("/") + 1), body);
    return {};
  }, async () => ({data: {
    canEdit: true, requirements: [{docId: "existing", sectionId: "manual-choice"}], nextCursor: null,
  }}));
  const url = (id: string) => `https://tms.example/work/?workspaceId=workspace&projectId=project&view=product-docs&docId=${id}`;
  f.original.current.description = `[Requirement](${url("existing")}&docSection=pasted-choice)`;
  f.original.current.preconditions = url("prerequisite") + "&docSection=login";
  f.original.current.steps = [
    {id: "step", order: 1, action: `[Flow](${url("flow")})`, expectedResult: "", required: true},
    {id: "shared", order: 2, action: url("shared"), expectedResult: "", required: true, sharedStepId: "shared"},
  ];
  f.render().actions.openEditCase();
  f.render().state.setCaseDraft({...f.render().state.caseDraft, title: "Existing coverage"});
  await f.render().actions.saveCase({preventDefault() {}} as never);
  assert.deepEqual(Object.fromEntries(written), {
    prerequisite: {sectionId: "login", preserveExisting: true}, flow: {sectionId: null, preserveExisting: true},
  });
  assert.equal(f.writes(), 1);
  assert.equal(f.selection().dialog, null);
  f.dispose();
});

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
