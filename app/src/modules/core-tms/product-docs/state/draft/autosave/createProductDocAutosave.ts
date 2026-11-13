import type { ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import { saveProductDocDraft } from "./saveProductDocDraft";
import type { ProductDocDraftBuffer } from "../draft-buffer";

export function createProductDocAutosave(input: {
  api: ProductDocsApi; scope: ProductDocScope; drafts: ProductDocDraftBuffer; untitled: string | (() => string);
  onError(error: unknown): void; onSaved?(): void;
}) {
  const { api, scope, drafts } = input;
  let active: Promise<boolean> | undefined;
  let disposed = false;
  async function drain(): Promise<boolean> {
    while (drafts.size && !disposed) {
      const [key, snapshot] = drafts.entries().next().value!;
      if (snapshot.blocked) { input.onError({ code: "PRODUCT_DOC_DRAFT_BLOCKED" }); return false; }
      const [workspaceId, projectId, id] = JSON.parse(key) as string[];
      if (workspaceId !== scope.workspaceId || projectId !== scope.projectId) return false;
      const epoch = drafts.epoch?.(key) ?? 0;
      try {
        const baseline = await saveProductDocDraft(api, scope, id, snapshot, typeof input.untitled === "function" ? input.untitled() : input.untitled);
        if (drafts.acknowledge) drafts.acknowledge(key, snapshot, baseline, epoch);
        else if (drafts.get(key) === snapshot) drafts.delete(key);
        else {
          const current = drafts.get(key);
          if (current) drafts.set(key, { ...current, baseline });
        }
        if (!disposed) input.onSaved?.();
      } catch (error) {
        if (!disposed) input.onError(error);
        return false;
      }
    }
    return !disposed;
  }
  function flush(): Promise<boolean> {
    if (active) return active;
    active = drain().finally(() => { active = undefined; });
    return active;
  }
  drafts.flush = flush;
  drafts.saving = () => Boolean(active);
  return { flush, activate() { disposed = false; }, dispose() { disposed = true; }, busy: () => Boolean(active) };
}
