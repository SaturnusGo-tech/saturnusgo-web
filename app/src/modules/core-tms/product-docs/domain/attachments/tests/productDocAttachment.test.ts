import assert from "node:assert/strict";
import { test } from "node:test";
import type { LeafDirective } from "mdast-util-directive";
import { attachmentFileName, markProductDocAttachment, readProductDocAttachment } from "../productDocAttachment";

const id = "docfile_2cd4b585-409d-4682-a956-ffdb1e483907";

test("keeps a valid private attachment and bounded size in the article reader", () => {
  const node: LeafDirective = { type: "leafDirective", name: "falcon-file", attributes: { attachment: id, width: "511" }, children: [] };
  assert.equal(markProductDocAttachment(node), true);
  assert.deepEqual(node.data?.hProperties, { attachment: id, width: 511 });
  assert.deepEqual(readProductDocAttachment({ attachment: id, width: "4097" }), { attachment: id, width: undefined });
  assert.equal(readProductDocAttachment({ attachment: "https://foreign.test/track.png", width: "300" }).attachment, "");
});

test("accepts expected file extensions, inferring pasted screenshot type when needed", () => {
  for (const name of ["Sample.XLS", "Plan.xlsx", "Test.docx", "Report.pdf", "picture.png", "photo.jpeg", "phone.heic", "phone.HEIF", "Clip.mov", "clip.mp4", "Sound.mp3"]) {
    assert.equal(attachmentFileName({ name, type: "" }), name);
  }
  assert.equal(attachmentFileName({ name: "image", type: "image/png" }), "image.png");
  assert.equal(attachmentFileName({ name: "bad.exe", type: "image/png" }), null);
});
