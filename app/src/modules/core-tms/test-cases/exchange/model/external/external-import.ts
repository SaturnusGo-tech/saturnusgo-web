import type { PortableTestCase } from "../test-case-exchange";
export interface ExternalImportRecord { path: string; value: unknown; context: string[] }
export interface ExternalImportCase { sourcePath: string; value: PortableTestCase; warnings: string[] }
export interface ExternalImportIssue { sourcePath: string; code: string }
export interface ExternalImportPort {
  inspect(source: unknown, signal: AbortSignal): Promise<ExternalImportRecord[]>;
  normalize(records: ExternalImportRecord[], folders: string[], signal: AbortSignal): Promise<{ cases: ExternalImportCase[]; issues: ExternalImportIssue[] }>;
}
export interface ExternalImportCheckpoint {
  records: ExternalImportRecord[] | null; processed: number; cases: ExternalImportCase[]; issues: ExternalImportIssue[];
}
