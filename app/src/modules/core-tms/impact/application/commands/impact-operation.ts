import type { ImpactCommand, ImpactScope } from "../../model/impact-types";
export function impactJournalOwner(subject: string | null, scope: ImpactScope, id: string) {
  return `falcon-impact:${JSON.stringify([subject, scope.workspaceId, scope.projectId, id])}`;
}
export type ImpactOperation = { key: string; etag: string; command: ImpactCommand };
export interface OperationStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
const memory = new Map<string, ImpactOperation>();
export class ImpactOperations {
  constructor(private readonly owner: string, private readonly storage?: OperationStorage,
    private readonly newKey = () => crypto.randomUUID()) {}
  pending(): ImpactOperation | null {
    const cached = memory.get(this.owner); if (cached) return cached;
    try {
      const raw = this.storage?.getItem(this.owner); if (!raw || raw.length > 200_000) return null;
      const saved = JSON.parse(raw) as ImpactOperation;
      if (typeof saved.key !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(saved.key) || typeof saved.etag !== "string"
        || !saved.etag || saved.etag.length > 512 || !saved.command || !/^(scope|approve|retry|gaps\/[A-Za-z0-9._:-]{1,128}\/(generate|acknowledge))$/.test(saved.command.action)
        || typeof saved.command.body !== "object" || !saved.command.body) return null;
      memory.set(this.owner, saved); return saved;
    } catch { return null; }
  }
  begin(command: ImpactCommand, etag: string): ImpactOperation {
    const old = this.pending();
    if (old) {
      if (JSON.stringify(old.command) !== JSON.stringify(command)) throw new Error("IMPACT_OPERATION_UNRESOLVED");
      return old;
    }
    const entry = { key: this.newKey(), etag, command: structuredClone(command) };
    memory.set(this.owner, entry);
    try { this.storage?.setItem(this.owner, JSON.stringify(entry)); } catch { /* In-memory replay remains available. */ }
    return entry;
  }
  complete(key: string) {
    if (this.pending()?.key !== key) return;
    memory.delete(this.owner); try { this.storage?.removeItem(this.owner); } catch { /* Memory remains cleared. */ }
  }
}
