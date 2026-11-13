import { useRef, useState, type DragEvent } from "react";
import { MAX_EVIDENCE_FILES } from "../../../../../application/evidence/batch/evidenceBatchLimit";
import { fileTransferHandlers } from "../../../../cases/inspector/attachments/input/fileTransfer";
import { appendDefectFiles } from "../../../defect-layout/files";

export function useDefectFileTransfer(files: File[], onChange: (files: File[]) => void, disabled: boolean) {
  const staged = useRef(files);
  staged.current = files;
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const addFiles = (added: File[]) => {
    if (disabled || !added.length) return;
    const next = appendDefectFiles(staged.current, added);
    if (next.length > MAX_EVIDENCE_FILES) { setLimitExceeded(true); return; }
    staged.current = next;
    setLimitExceeded(false);
    onChange(next);
  };
  const changeFiles = (next: File[]) => {
    if (disabled) return;
    staged.current = next;
    setLimitExceeded(false);
    onChange(next);
  };
  const handlers = fileTransferHandlers(addFiles);
  const resetDrag = () => { depth.current = 0; setDragging(false); };
  return { addFiles, changeFiles, limitExceeded, dragging,
    onPasteCapture: handlers.onPaste,
    onDragOverCapture: handlers.onDragOver,
    onDropCapture: (event: DragEvent) => { resetDrag(); handlers.onDrop?.(event); },
    onDragEnterCapture: (event: DragEvent) => {
      if (disabled || !event.dataTransfer.types.includes("Files")) return;
      depth.current++; setDragging(true);
    },
    onDragLeaveCapture: (event: DragEvent) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      if (--depth.current <= 0) resetDrag();
    },
    onDragEndCapture: resetDrag,
  };
}
