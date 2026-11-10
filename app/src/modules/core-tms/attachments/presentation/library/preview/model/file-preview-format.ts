export type FilePreviewKind = "sheet" | "pdf" | "image" | "video" | "audio" | "text" | "archive" | "unsupported";

export type SheetCell = { text: string; formula?: string };
export type PreviewSheet = {
  name: string;
  rows: number;
  columns: number;
  widths: (number | null)[];
  cells: Record<number, Record<number, SheetCell>>;
};
export type ArchiveEntry = { name: string; size: number; directory: boolean; previewable?: true };
export type ParsedFilePreview =
  | { kind: "sheet"; sheets: PreviewSheet[]; limited: boolean }
  | { kind: "archive"; entries: ArchiveEntry[]; limited: boolean }
  | { kind: "text"; text: string; limited: boolean };
export type FilePreviewRequest = {
  kind: ParsedFilePreview["kind"] | "archive-entry";
  filename: string;
  blob: Blob;
  mimeType?: string;
};

const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "heic", "heif", "tif", "tiff"]);
const audioExtensions = new Set(["mp3", "wav", "ogg", "oga", "m4a", "flac", "aac", "opus"]);
const videoExtensions = new Set(["mp4", "mov", "webm", "ogv", "m4v"]);
const sheetExtensions = new Set(["xlsx", "xls", "xlsm", "xlsb", "ods", "csv", "tsv"]);
const textExtensions = new Set(["txt", "md", "markdown", "log", "json", "jsonl", "ndjson", "xml", "yaml", "yml", "sql",
  "css", "scss", "less", "html", "htm", "svg", "js", "mjs", "cjs", "jsx", "ts", "mts", "cts", "tsx", "vue", "svelte",
  "py", "rb", "go", "rs", "sh", "bash", "zsh", "fish", "ps1", "java", "kt", "kts", "swift", "dart", "scala", "php",
  "c", "h", "cpp", "cxx", "cc", "hpp", "cs", "m", "mm", "lua", "r", "pl", "proto", "graphql", "gql",
  "toml", "ini", "cfg", "conf", "properties", "env", "tf", "hcl", "diff", "patch", "rtf", "rst", "ipynb", "webmanifest"]);
const textName = /^(?:readme|license|licence|notice|authors|copying|changelog|contributing|dockerfile|containerfile|makefile|gnumakefile|gemfile|rakefile|procfile)(?:\.|$)|^\.(?:env(?:\.|$)|gitignore$|gitattributes$|gitmodules$|dockerignore$|editorconfig$|npmrc$|yarnrc$|nvmrc$|prettierrc$|eslintrc$|babelrc$)/i;

function basename(filename: string) {
  return filename.split(/[\\/]/).pop() ?? "";
}

function mediaType(mimeType: string) {
  return mimeType.split(";")[0].trim().toLowerCase();
}

export function fileExtension(filename: string) {
  return /\.([^.]+)$/.exec(basename(filename))?.[1].toLowerCase() ?? "";
}

export function isJsonFile(filename: string, mimeType = "") {
  const extension = fileExtension(filename);
  return extension !== "jsonl" && extension !== "ndjson"
    && (["json", "ipynb", "webmanifest"].includes(extension) || /^application\/(?:[^/]+\+)?json$/.test(mediaType(mimeType)));
}

export function getFilePreviewKind(filename: string, mimeType: string): FilePreviewKind {
  const extension = fileExtension(filename);
  const mime = mediaType(mimeType);
  if (extension === "svg" || mime === "image/svg+xml") return "text";
  if (sheetExtensions.has(extension) || /spreadsheet|ms-excel/.test(mime) || mime === "text/csv" || mime === "text/tab-separated-values") return "sheet";
  if (extension === "pdf" || mime === "application/pdf") return "pdf";
  if (extension === "zip" || mime === "application/zip" || mime === "application/x-zip-compressed") return "archive";
  if (imageExtensions.has(extension) || /^image\/(avif|bmp|gif|heic|heif|jpeg|png|tiff|webp|x-icon)$/.test(mime)) return "image";
  if (audioExtensions.has(extension) || mime.startsWith("audio/")) return "audio";
  if (videoExtensions.has(extension) || mime.startsWith("video/")) return "video";
  if (textExtensions.has(extension) || textName.test(basename(filename)) || isJsonFile(filename, mime)
    || mime.startsWith("text/") || /^application\/(xml|javascript|x-yaml|x-ndjson)$/.test(mime)) return "text";
  return "unsupported";
}

export function columnName(column: number): string {
  let name = "";
  for (let index = column + 1; index > 0; index = Math.floor((index - 1) / 26)) {
    name = String.fromCharCode(65 + (index - 1) % 26) + name;
  }
  return name;
}
