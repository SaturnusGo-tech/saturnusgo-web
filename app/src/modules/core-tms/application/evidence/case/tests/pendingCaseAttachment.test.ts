import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PENDING_CASE_ATTACHMENTS,
  appendPendingCaseAttachments,
  filesFromClipboard,
  filterPendingCaseAttachments,
  groupPendingCaseAttachments,
} from "../pendingCaseAttachment";

const file = (name: string, lastModified = 1) => new File([name], name, {
  type: name.endsWith(".png") ? "image/png" : "text/plain",
  lastModified,
});

test("pending case files are deduplicated and capped across all fields", () => {
  const first = appendPendingCaseAttachments([], {
    fieldKey: "description",
    files: [file("screen.png"), file("screen.png")],
  }, () => "attachment-1");
  assert.equal(first.accepted, 1);
  assert.equal(first.rejected, 1);
  const full = Array.from({ length: MAX_PENDING_CASE_ATTACHMENTS }, (_, index) => ({
    id: `id-${index}`,
    fieldKey: "description",
    file: file(`file-${index}.txt`),
  }));
  const overflow = appendPendingCaseAttachments(full, {
    fieldKey: "preconditions",
    files: [file("overflow.txt")],
  });
  assert.equal(overflow.entries.length, MAX_PENDING_CASE_ATTACHMENTS);
  assert.equal(overflow.rejected, 1);
});

test("case files retain field identity and group by optional step owner", () => {
  const entries = [
    { id: "a", fieldKey: "description", file: file("case.txt") },
    { id: "b", fieldKey: "step:s1:action", stepId: "s1", file: file("one.png") },
    { id: "c", fieldKey: "step:s1:data", stepId: "s1", file: file("two.png") },
  ];
  assert.deepEqual(groupPendingCaseAttachments(entries).map((group) => ({
    stepId: group.stepId,
    files: group.files.map(({ name }) => name),
  })), [
    { stepId: undefined, files: ["case.txt"] },
    { stepId: "s1", files: ["one.png", "two.png"] },
  ]);
});

test("clipboard extraction supports direct files and file-kind items", () => {
  const screenshot = file("clipboard.png");
  const direct = filesFromClipboard({ files: [screenshot], items: [] } as unknown as DataTransfer);
  assert.deepEqual(direct, [screenshot]);
  const fallback = filesFromClipboard({
    files: [],
    items: [
      { kind: "string", getAsFile: () => null },
      { kind: "file", getAsFile: () => screenshot },
    ],
  } as unknown as DataTransfer);
  assert.deepEqual(fallback, [screenshot]);
});

test("empty draft attachments are rejected before committing a case", () => {
  const result = appendPendingCaseAttachments([], {
    fieldKey: "description",
    files: [new File([], "empty.png", { type: "image/png" }), file("valid.png")],
  }, () => "attachment-1");
  assert.equal(result.rejected, 1);
  assert.deepEqual(result.entries.map(({ file }) => file.name), ["valid.png"]);
});

test("removing a checklist item discards only that item's pending case files", () => {
  const entries = [
    { id: "case", fieldKey: "description", file: file("case.png") },
    { id: "step", fieldKey: "step:old:action", stepId: "old", file: file("step.png") },
    { id: "check", fieldKey: "checklist:present", file: file("check.png") },
    { id: "removed", fieldKey: "checklist:old", file: file("removed.png") },
  ];
  assert.deepEqual(filterPendingCaseAttachments(entries, new Set(), new Set(["present"])).map(({ id }) => id), ["case", "check"]);
});
