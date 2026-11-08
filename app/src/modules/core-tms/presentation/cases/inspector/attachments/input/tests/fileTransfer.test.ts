import assert from "node:assert/strict";
import test from "node:test";
import type { ClipboardEvent, DragEvent } from "react";
import { fileTransferHandlers } from "../fileTransfer";

test("file transfer intercepts binary paste and drop once while preserving text", () => {
  const calls: File[][] = [];
  const transfer = fileTransferHandlers(files => calls.push(files));
  const image = new File(["PNG"], "evidence.png", { type: "image/png" });
  let prevented = 0;
  let stopped = 0;
  const events = { preventDefault: () => prevented++, stopPropagation: () => stopped++ };
  const files = { types: ["Files"], files: [image], items: [], dropEffect: "none" };
  const text = { types: ["text/plain"], files: [], items: [], dropEffect: "none" };
  transfer.onPaste?.({ ...events, clipboardData: text } as unknown as ClipboardEvent);
  transfer.onDrop?.({ ...events, dataTransfer: text } as unknown as DragEvent);
  assert.equal(prevented, 0);
  transfer.onPaste?.({ ...events, clipboardData: files } as unknown as ClipboardEvent);
  transfer.onDragOver?.({ ...events, dataTransfer: files } as unknown as DragEvent);
  transfer.onDrop?.({ ...events, dataTransfer: files } as unknown as DragEvent);
  assert.equal(files.dropEffect, "copy");
  assert.equal(prevented, 3);
  assert.equal(stopped, 2);
  assert.deepEqual(calls, [[image], [image]]);
});
