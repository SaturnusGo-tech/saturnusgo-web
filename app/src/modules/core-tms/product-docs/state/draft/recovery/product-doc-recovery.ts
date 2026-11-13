import type { ProductDocScope } from "../../../domain/product-docs";
import type { BufferedProductDocDraft, ProductDocDraftBuffer } from "../draft-buffer";

type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
function content(value: unknown): value is BufferedProductDocDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as BufferedProductDocDraft;
  const valid = (entry: BufferedProductDocDraft | BufferedProductDocDraft["baseline"]) =>
    typeof entry.title === "string" && entry.title.length <= 500 && Array.isArray(entry.sections) && entry.sections.length <= 100
    && entry.sections.every(section => section && typeof section.id === "string" && typeof section.title === "string"
      && typeof section.markdown === "string" && section.markdown.length <= 32_768);
  return valid(draft) && !!draft.baseline && valid(draft.baseline)
    && Number.isSafeInteger(draft.baseline.version) && draft.baseline.version >= 1;
}
export function productDocRecovery(storage: StoragePort | undefined, ownerId: string | null, scope: ProductDocScope) {
  const key = ownerId ? `falcon:product-doc-recovery:v1:${JSON.stringify([ownerId, scope.workspaceId, scope.projectId])}` : null;
  return {
    read(): [string, BufferedProductDocDraft][] {
      if (!storage || !key) return [];
      try {
        const saved: unknown = JSON.parse(storage.getItem(key) ?? "[]");
        if (!Array.isArray(saved)) return [];
        return saved.slice(0, 100).filter((entry): entry is [string, BufferedProductDocDraft] => {
          if (!Array.isArray(entry) || typeof entry[0] !== "string" || !content(entry[1])) return false;
          const address: unknown = JSON.parse(entry[0]);
          return Array.isArray(address) && address.length === 3 && address[0] === scope.workspaceId
            && address[1] === scope.projectId && typeof address[2] === "string";
        });
      } catch { return []; }
    },
    write(drafts: ProductDocDraftBuffer): boolean {
      if (!storage || !key) return false;
      try {
        if (drafts.size) storage.setItem(key, JSON.stringify([...drafts]));
        else storage.removeItem(key);
        return true;
      } catch { return false; }
    },
  };
}
