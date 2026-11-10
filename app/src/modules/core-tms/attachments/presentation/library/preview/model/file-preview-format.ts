export type FilePreviewKind = "sheet" | "pdf" | "image" | "video" | "audio" | "text" | "archive" | "unsupported";

export type SheetCell = { text: string; formula?: string };
export type PreviewSheet = {
  name: string;
  rows: number;
  columns: number;
  widths: (number | null)[];
  cells: Record<number, Record<number, SheetCell>>;
};
export type ArchiveEntry = { name: string; size: number; directory: boolean };
export type ParsedFilePreview =
  | { kind: "sheet"; sheets: PreviewSheet[]; limited: boolean }
  | { kind: "archive"; entries: ArchiveEntry[]; limited: boolean }
  | { kind: "text"; text: string; limited: boolean };
export type FilePreviewRequest = { kind: ParsedFilePreview["kind"]; filename: string; blob: Blob };

const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "heic", "heif", "tif", "tiff"]);
const audioExtensions = new Set(["mp3", "wav", "ogg", "oga", "m4a", "flac", "aac", "opus"]);
const videoExtensions = new Set(["mp4", "mov", "webm", "ogv", "m4v"]);
const sheetExtensions = new Set(["xlsx", "xls", "xlsm", "xlsb", "ods", "csv", "tsv"]);
const textExtensions = new Set(["txt", "md", "markdown", "log", "json", "jsonl", "xml", "yaml", "yml", "sql",
  "css", "html", "htm", "svg", "js", "jsx", "ts", "tsx", "py", "rb", "go", "rs", "sh", "java", "kt", "swift",
  "toml", "ini", "conf", "diff", "patch", "rtf"]);

export function fileExtension(filename: string) {
  return /\.([^.]+)$/.exec(filename)?.[1].toLowerCase() ?? "";
}

export function getFilePreviewKind(filename: string, mimeType: string): FilePreviewKind {
  const extension = fileExtension(filename);
  const mime = mimeType.split(";")[0].trim().toLowerCase();
  if (extension === "svg" || mime === "image/svg+xml") return "text";
  if (sheetExtensions.has(extension) || /spreadsheet|ms-excel/.test(mime) || mime === "text/csv" || mime === "text/tab-separated-values") return "sheet";
  if (extension === "pdf" || mime === "application/pdf") return "pdf";
  if (extension === "zip" || mime === "application/zip" || mime === "application/x-zip-compressed") return "archive";
  if (imageExtensions.has(extension) || /^image\/(avif|bmp|gif|heic|heif|jpeg|png|tiff|webp|x-icon)$/.test(mime)) return "image";
  if (audioExtensions.has(extension) || mime.startsWith("audio/")) return "audio";
  if (videoExtensions.has(extension) || mime.startsWith("video/")) return "video";
  if (textExtensions.has(extension) || mime.startsWith("text/") || /^application\/(json|xml|javascript|x-yaml)$/.test(mime)) return "text";
  return "unsupported";
}

export function columnName(column: number): string {
  let name = "";
  for (let index = column + 1; index > 0; index = Math.floor((index - 1) / 26)) {
    name = String.fromCharCode(65 + (index - 1) % 26) + name;
  }
  return name;
}
