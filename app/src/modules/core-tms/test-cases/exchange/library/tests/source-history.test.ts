import test from "node:test";
import assert from "node:assert/strict";
import { createImportSourceSaver } from "../application/save-import-source";
import { importFileLink } from "../application/import-file-link";
import { buildWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { PrivateAttachmentClient } from "../../../../attachments/application/private-attachment-client";

test("receipt retries preserve exact original bytes, reuse the finalized attachment and lock scope", async () => {
  const source = new File(['\ufeff{ "title": "Кейс" }\n'], "original.json", { type: "text/plain" });
  const scope = { workspaceId: "w", projectId: "p" }; let uploads = 0; let writes = 0; let saved = 0;
  const client = { upload: async (input: { file: File; mimeType: string }) => {
    uploads++; assert.deepEqual(await input.file.arrayBuffer(), await source.arrayBuffer());
    assert.equal(input.mimeType, "application/json"); return { id: "source-1" };
  } } as unknown as PrivateAttachmentClient;
  const http = { mutate: async (path: string, method: string, body: { folderId: string | null }) => {
    writes++; assert.equal(path, "/workspaces/w/projects/p/import-files/source-1"); assert.equal(method, "POST");
    assert.equal(body.folderId, "folder"); if (writes === 1) throw new Error("Transient receipt failure");
    return { ...scope, id: "source-1", fileName: source.name, status: "ready", createdBy: "actor", createdAt: "2026-09-22T12:00:00Z" };
  } } as unknown as TmsHttpClient;
  const save = createImportSourceSaver(http, client, () => { saved++; }); const signal = new AbortController().signal;
  await assert.rejects(save(source, scope, "folder", signal), /Transient/);
  await save(source, scope, "folder", signal); await save(source, scope, "folder", signal);
  assert.deepEqual({ uploads, writes, saved }, { uploads: 1, writes: 2, saved: 1 });
  await assert.rejects(save(source, { ...scope, projectId: "foreign" }, "folder", signal), /destination changed/);
});
test("file links contain project scope and disappear when navigation changes scope or view", () => {
  const url = importFileLink("https://team.example/work/?workspaceId=w&projectId=p&view=cases&caseId=old", {workspaceId:"w",projectId:"p",id:"file-1"});
  assert.equal(new URL(url).searchParams.get("view"), "imports");
  assert.equal(new URL(url).searchParams.get("importFile"), "file-1");
  assert.equal(new URL(url).searchParams.has("caseId"), false);
  const input = { workspaceId: "w", projectId: "p", view: "imports" as const, runId: null };
  assert.equal(new URL(buildWorkspaceDeepLink(url, input)).searchParams.get("importFile"), "file-1");
  assert.equal(new URL(buildWorkspaceDeepLink(url, {...input,projectId:"other"})).searchParams.has("importFile"), false);
  assert.equal(new URL(buildWorkspaceDeepLink(url, {...input,view:"cases"})).searchParams.has("importFile"), false);
});
