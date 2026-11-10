import { parseFilePreview } from "./file-preview-parser";
import type { FilePreviewRequest } from "../model/file-preview-format";

self.addEventListener("message", (event: MessageEvent<FilePreviewRequest>) => {
  void parseFilePreview(event.data).then(
    (data) => self.postMessage({ data }),
    () => self.postMessage({ failed: true }),
  );
});
