import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { createDefect } from "../../../../application/defects/createDefect";
import { mapDefect } from "../../../data/defect-mapper";
import { defectDto } from "../fixture/defect-dto";

test("manual creation transmits stable folder and exact shared revision references without fabricated execution data", async () => {
  const writes: { body: Record<string, unknown>; key: string | null }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: async (_url, init) => {
      if (init?.method === "POST") writes.push({ body: JSON.parse(String(init.body)), key: new Headers(init.headers).get("Idempotency-Key") });
      return Response.json({ data: defectDto });
    } });
  const unavailable = async (): Promise<never> => { throw new Error("No evidence access expected"); };
  const payload = { ...mapDefect(defectDto), runId: null, runItemId: null, stepId: null, sourceCaseId: null,
    sourceFolderId: "folder-1", reproductionSharedSteps: [{ sharedStepId: "shared-1", revision: 2 }] };
  const input = { http, attachments: { getMetadata: unavailable, upload: unavailable, createAccess: unavailable, remove: unavailable },
    projectId: "project-1", payload, files: [], operationKey: "defect:create-1", offline: false, locale: "en" as const };
  await createDefect(input);
  await createDefect({ ...input, payload: { ...payload, sourceFolderId: null, reproductionSharedSteps: [] } });
  assert.equal(writes[0].body.sourceFolderId, "folder-1");
  assert.deepEqual(writes[0].body.reproductionSharedSteps, [{ sharedStepId: "shared-1", revision: 2 }]);
  assert.equal(writes[0].key, "defect:create-1");
  assert.equal("sourceLocation" in writes[0].body, false);
  assert.equal("reproduction" in writes[0].body, false);
  assert.equal("attemptNo" in writes[0].body, false);
  assert.equal(writes[1].body.sourceFolderId, null);
  assert.equal("reproductionSharedSteps" in writes[1].body, false);
});
