import test from "node:test";
import assert from "node:assert/strict";
import { createImportSourceSaver } from "../../application/save-import-source";
import type { PrivateAttachmentClient } from "../../../../../attachments/application/private-attachment-client";
import type { TmsHttpClient } from "../../../../../../../core/tms/transport/http";

test("export source history retains raw non-JSON bytes and their canonical storage media", async () => {
  for (const [name, mime, bytes] of [["linear.csv", "text/plain", 'Title,Description\r\n"Import","Exact, text"\r\n'],
    ["cases.xml", "text/plain", '<suite><name>Кейсы</name></suite>'],
    ["cases.xlsx", "application/octet-stream", '\u0050\u004b\u0003\u0004']]) {
    const source = new File([bytes], name, { type: mime }); let uploads = 0;
    const client = { upload: async (input: { file: File; mimeType: string }) => {
      uploads++; assert.equal(input.mimeType, mime); assert.equal(input.file.name, name);
      assert.deepEqual(await input.file.arrayBuffer(), await source.arrayBuffer()); return { id: "original" };
    } } as unknown as PrivateAttachmentClient;
    const http = { mutate: async () => ({ id: "original", status: "ready" }) } as unknown as TmsHttpClient;
    await createImportSourceSaver(http, client, () => {})(source, { workspaceId: "w", projectId: "p" }, null, new AbortController().signal);
    assert.equal(uploads, 1);
  }
});
