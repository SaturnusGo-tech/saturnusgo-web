import { test } from "node:test";
import assert from "node:assert/strict";
import { readCommentAttachments, writeCommentAttachments } from "../comment-attachments";
test("attachment references round-trip without signed URLs or altering Markdown", () => {
  const text = "**Result**\n\n> quoted text\n\n[docs](https://example.com/docs)";
  const attachments = [{ id: "attachment_1-2", name: "[screenshot] \\ QA.png" }, { id: "attachment_2", name: "report.pdf" }];
  assert.deepEqual(readCommentAttachments(writeCommentAttachments(text, attachments)), { text, attachments });
});
test("filenames cannot inject additional Markdown or links", () => {
  const body = writeCommentAttachments("", [{ id: "attachment_1", name: "x](https://evil.example)\n[other].png" }]);
  const parsed = readCommentAttachments(body);
  assert.equal(parsed.text, "");
  assert.deepEqual(parsed.attachments, [{ id: "attachment_1", name: "x](https://evil.example) [other].png" }]);
  assert.throws(() => writeCommentAttachments("", [{ id: "../another", name: "bad" }]));
});
test("ordinary links remain text and duplicate attachment references appear once", () => {
  const link = "[x](/falcon-attachments/attachment_1)";
  assert.deepEqual(readCommentAttachments(`${link}\n${link}\n\n[normal](/other/path)`), {
    text: "[normal](/other/path)", attachments: [{ id: "attachment_1", name: "x" }],
  });
});
test("file-only comments and legacy comments remain editable", () => {
  assert.deepEqual(readCommentAttachments("old comment"), { text: "old comment", attachments: [] });
  const body = writeCommentAttachments("", [{ id: "attachment_1", name: "image.png" }]);
  assert.ok(body.trim());
  assert.equal(writeCommentAttachments(readCommentAttachments(body).text, readCommentAttachments(body).attachments), body);
});
