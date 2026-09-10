import type { ExternalImportCheckpoint, ExternalImportPort, ExternalImportRecord } from "../../model/external/external-import";
export async function normalizeExternalImport(port: ExternalImportPort, source: unknown, checkpoint: ExternalImportCheckpoint,
  existingFolders: string[], signal: AbortSignal, progress: () => void): Promise<void> {
  signal.throwIfAborted();
  if (!checkpoint.records) {
    const records = await port.inspect(source, signal);
    signal.throwIfAborted(); checkpoint.records = records; progress();
  }
  while (checkpoint.processed < checkpoint.records.length) {
    signal.throwIfAborted();
    const batch: ExternalImportRecord[] = []; let size = 0;
    for (const record of checkpoint.records.slice(checkpoint.processed, checkpoint.processed + 15)) {
      const bytes = new TextEncoder().encode(JSON.stringify(record)).length;
      if (size + bytes > 350_000 && batch.length) break;
      if (bytes > 350_000) throw new Error("IMPORT_LIMIT_EXCEEDED");
      batch.push(record); size += bytes;
    }
    const folders = [...new Set([...checkpoint.cases.map(c => c.value.folderPath), ...existingFolders])].slice(0, 100);
    const result = await port.normalize(batch, folders, signal);
    signal.throwIfAborted();
    const returned = [...result.cases.map(c => c.sourcePath), ...result.issues.map(c => c.sourcePath)];
    if (returned.length !== batch.length || new Set(returned).size !== batch.length || returned.some(p => !batch.some(r => r.path === p))) throw new Error("IMPORT_MAPPING_INVALID");
    checkpoint.cases.push(...result.cases); checkpoint.issues.push(...result.issues); checkpoint.processed += batch.length;
    progress();
  }
}
