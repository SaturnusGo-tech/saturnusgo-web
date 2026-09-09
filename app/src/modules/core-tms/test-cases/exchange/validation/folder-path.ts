export function validateImportFolderPath(value: string): string {
  if (value === "/") return value;
  const parts = value.split("/").slice(1);
  if (!value.startsWith("/") || value.length > 500 || !parts.length || parts.some((part) =>
    !part || part !== part.trim() || part.length > 120 || part === "." || part === ".." || /[\\\p{Cc}]/u.test(part))) {
    throw new Error(`Invalid folder path: ${value.slice(0, 100)}`);
  }
  return value;
}
export function importDestinationPath(destination: string, source: string): string {
  validateImportFolderPath(destination);
  validateImportFolderPath(source);
  return validateImportFolderPath(`${destination === "/" ? "" : destination}${source === "/" ? "" : source}` || "/");
}
