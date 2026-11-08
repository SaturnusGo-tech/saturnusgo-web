import type { ClipboardEvent, DragEvent } from "react";
import { filesFromClipboard } from "../../../../../application/evidence/case/pendingCaseAttachment";

export function fileTransferHandlers(onFiles?: (files: File[]) => void) {
  if (!onFiles) return {};
  function ingest(event: ClipboardEvent | DragEvent, transfer: DataTransfer) {
    const files = filesFromClipboard(transfer);
    if (!files.length) return;
    event.preventDefault();
    event.stopPropagation();
    onFiles?.(files);
  }
  return {
    onPaste: (event: ClipboardEvent) => ingest(event, event.clipboardData),
    onDrop: (event: DragEvent) => ingest(event, event.dataTransfer),
    onDragOver: (event: DragEvent) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
  };
}
