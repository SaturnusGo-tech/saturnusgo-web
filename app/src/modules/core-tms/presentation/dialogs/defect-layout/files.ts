export function appendDefectFiles(current: readonly File[], added: readonly File[]): File[] {
  const files = new Map(current.map(file => [`${file.name}:${file.size}:${file.lastModified}`, file]));
  for (const file of added) files.set(`${file.name}:${file.size}:${file.lastModified}`, file);
  return [...files.values()];
}
