import { BlobReader, ZipReader, type FileEntry } from "@zip.js/zip.js";
import { getFilePreviewKind, type ArchiveEntry, type ParsedFilePreview } from "../../model/file-preview-format";
import { decodeTextPreview, textByteLimit } from "../text/text-preview";

const archiveEntryLimit = 2_000;
const archiveTextByteLimit = 4 * 1024 * 1024;

function archivePath(filename: string, directory: boolean) {
  if (filename.length > 1_024 || /[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(filename)) return undefined;
  const path = filename.replaceAll("\\", "/");
  if (path.startsWith("/") || /^[a-z]:/i.test(path)) return undefined;
  const segments = path.split("/").filter(part => part !== "" && part !== ".");
  if (!segments.length || segments.length > 64 || segments.includes("..") || /^[a-z]:/i.test(segments[0])) return undefined;
  return segments.join("/") + (directory ? "/" : "");
}

function canPreview(entry: FileEntry, name: string) {
  return !entry.encrypted && !entry.symlink
    && Number.isSafeInteger(entry.uncompressedSize) && entry.uncompressedSize >= 0
    && entry.uncompressedSize <= archiveTextByteLimit
    && (getFilePreviewKind(name, "") === "text" || /\.(?:csv|tsv)$/i.test(name));
}

async function readSource(entry: FileEntry, name: string) {
  const bytes = new Uint8Array(Math.min(textByteLimit, entry.uncompressedSize));
  let written = 0;
  await entry.getData(new WritableStream<Uint8Array>({
    write(chunk) {
      if (written + chunk.byteLength > entry.uncompressedSize) throw new Error("ZIP entry exceeds its declared size");
      if (written < bytes.length) bytes.set(chunk.subarray(0, bytes.length - written), written);
      written += chunk.byteLength;
    },
  }), { useWebWorkers: false, checkSignature: true, checkLocalFilename: true });
  if (written !== entry.uncompressedSize) throw new Error("ZIP entry size mismatch");
  const limited = written > bytes.length;
  return decodeTextPreview(bytes, limited, name);
}

export async function parseArchivePreview(blob: Blob, selectedPath?: string): Promise<ParsedFilePreview> {
  // Paths are only labels in the viewer. Unsafe entries can be skipped without discarding safe siblings.
  const reader = new ZipReader(new BlobReader(blob), { filenameValidation: "tolerant" });
  const entries = new Map<string, ArchiveEntry>();
  let limited = false;
  let scanned = 0;
  try {
    for await (const entry of reader.getEntriesGenerator()) {
      if (++scanned > archiveEntryLimit) {
        limited = true;
        break;
      }
      const name = archivePath(entry.filename, entry.directory);
      if (!name || entries.has(name)) continue;
      const previewable = !entry.directory && canPreview(entry, name);
      if (name === selectedPath && previewable) return await readSource(entry, name);
      entries.set(name, {
        name, size: entry.uncompressedSize, directory: entry.directory,
        ...(previewable ? { previewable: true } : {}),
      });
    }
    if (selectedPath !== undefined) throw new Error("ZIP entry cannot be previewed");
    return { kind: "archive", entries: [...entries.values()], limited };
  } finally {
    await reader.close();
  }
}
