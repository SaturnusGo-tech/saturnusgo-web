import { saveCaseWithAttachments } from "../../../application/evidence/case/save/saveCaseWithAttachments";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { resolvePendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import type { TestCase } from "../../../../../core/tms/contracts/legacy-contract";
import type { PrivateAttachmentClient } from "../../../attachments/application/private-attachment-client";
import type { useCaseActions } from "../useCaseActions";

function harness(folderPath: string, folderId: string | null | undefined, archived = false, upload?: PrivateAttachmentClient["upload"]) {
  const saved = { id: "case-b", projectId: "project-a", folderPath, folderId,
    title: "Saved", currentRevision: 1, current: {}, linkIds: [] } as unknown as TestCase;
  let selectedFolder = "/A";
  let selectedFolderId = "folder-a";
  const notices: string[] = [];
  const state = {
    connection: "connected", editing: archived, caseDraft: { title: "New case", tags: [], steps: [] }, caseFolderPath: folderPath,
    isCaseSubmitting: () => false,
    setCaseDraft: () => { throw new Error("Archived case must not open an editor"); },
    beginCaseSubmission: () => true, finishCaseSubmission: () => undefined,
    setData: (update: (current: { testCases: TestCase[] }) => unknown) => update({ testCases: [] }),
    setSelectedCaseId: () => undefined, setSelectedCaseDetail: () => undefined, setSelectedCaseEtag: () => undefined,
    setSelectedFolder: (value: string) => { selectedFolder = value; },
    setSelectedFolderId: (value: string) => { selectedFolderId = value; },
    setDialog: () => undefined,
  };
  const module = { exports: {} as { useCaseActions: typeof useCaseActions } };
  const source = readFileSync(new URL("../useCaseActions.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, {
    module, exports: module.exports, crypto,
    require(name: string) {
      if (name === "react") return { useRef: (current: unknown) => ({ current }), useState: (value: unknown) => [value, () => {}] };
      if (name.endsWith("pending-operation")) return { resolvePendingOperation };
      if (name.endsWith("mutation-failure")) return { toTmsMutationFailure: (value: unknown) => value, formatTmsMutationFailure: () => "Unexpected failure" };
      if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
      if (name.endsWith("AttachmentClientProvider")) return { useAttachmentClient: () => ({ upload }) };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
      if (name.endsWith("test-case-api")) {
        const response = async () => ({ data: saved, etag: '"case-b:1"' });
        return { createTestCase: response, cloneTestCase: response, getTestCase: response };
      }
      if (name.endsWith("caseRevision")) return { normalizeRevisionTags: (tags: string[]) => tags };
      if (name.endsWith("pendingCaseAttachment")) return { pendingCaseAttachmentSignature: () => "" };
      if (name.endsWith("saveCaseWithAttachments")) return { saveCaseWithAttachments };
      if (name.endsWith("uploadCaseAttachments") || name.endsWith("createUid")) return {};
      throw new Error(`Unexpected import ${name}`);
    },
  });
  const actions = module.exports.useCaseActions(state as unknown as Parameters<typeof useCaseActions>[0],
    { project: { id: "project-a" }, selectedRevision: {}, selectedCase: { id: "source", archivedAt: archived ? "2026-09-09" : null } } as unknown as Parameters<typeof useCaseActions>[1],
    (message) => notices.push(message));
  return { actions, notices, selection: () => ({ folderPath: selectedFolder, folderId: selectedFolderId }) };
}

test("saving through the canonical creator follows the returned folder identity", async () => {
  const h = harness("/B", "folder-b");
  await h.actions.saveCase({ preventDefault() {} } as Parameters<typeof h.actions.saveCase>[0]);
  assert.deepEqual(h.selection(), { folderPath: "/B", folderId: "folder-b" });
  assert.deepEqual(h.notices, ["actions.caseCreated"]);
});

test("cloning an unfiled case clears the old folder identity to root", async () => {
  const h = harness("/", null);
  await h.actions.cloneCase();
  assert.deepEqual(h.selection(), { folderPath: "/", folderId: "root" });
});

test("legacy case responses without folder IDs cannot retain an unrelated stable selection", async () => {
  const h = harness("/Legacy", undefined);
  await h.actions.cloneCase();
  assert.deepEqual(h.selection(), { folderPath: "/Legacy", folderId: "" });
});

test("archived cases cannot open, save or clone through canonical actions", async () => {
  const h = harness("/Archived", "folder-archived", true);
  let prevented = false;
  h.actions.openEditCase();
  await h.actions.saveCase({ preventDefault() { prevented = true; } } as Parameters<typeof h.actions.saveCase>[0]);
  await h.actions.cloneCase();
  assert.equal(prevented, true);
  assert.deepEqual(h.selection(), { folderPath: "/A", folderId: "folder-a" });
  assert.deepEqual(h.notices, []);
});


test("the canonical save does not publish the new case or close its draft before uploads finish", async () => {
  let release!: () => void;
  const uploading = new Promise<void>((resolve) => { release = resolve; });
  const h = harness("/B", "folder-b", false, async () => { await uploading; return { id: "attachment", status: "ready" } as never; });
  const files = [{ id: "upload-1", fieldKey: "description", file: new File(["image"], "Screenshot.png", { type: "image/png" }) }];
  const job = h.actions.saveCase({ preventDefault() {} } as Parameters<typeof h.actions.saveCase>[0], files);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(h.selection(), { folderPath: "/A", folderId: "folder-a" });
  assert.deepEqual(h.notices, []);
  release(); await job;
  assert.deepEqual(h.selection(), { folderPath: "/B", folderId: "folder-b" });
  assert.deepEqual(h.notices, ["actions.caseCreated"]);
});
