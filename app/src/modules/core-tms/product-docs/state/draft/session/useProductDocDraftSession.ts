import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useAuthoringSession } from "../../../../authoring/leave/state/useAuthoringSession";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocsApi, ProductDocScope } from "../../../domain/product-docs";
import { productDocsCopy } from "../../../localization/copy";
import { productDocSaveError } from "../../../presentation/draft/actions/navigation/productDocSaveError";
import { createProductDocDraftBuffer } from "../buffer/createProductDocDraftBuffer";
import { createProductDocAutosave } from "../autosave/createProductDocAutosave";
import { productDocRecovery } from "../recovery/product-doc-recovery";

const idleSubscribe = () => () => {};
export function useProductDocDraftSession(input: {
  api: ProductDocsApi | null; enabled: boolean; scope: ProductDocScope; ownerId: string | null;
  locale: TmsLocale; notify(message: string): void;
}) {
  const latest = useRef(input); latest.current = input;
  const { api, scope, ownerId, enabled } = input;
  const identity = JSON.stringify([ownerId, scope.workspaceId, scope.projectId]);
  const drafts = useMemo(() => {
    let storage: Storage | undefined;
    try { storage = typeof window === "undefined" ? undefined : window.localStorage; } catch { /* Server draft saving remains available. */ }
    return createProductDocDraftBuffer(productDocRecovery(storage, ownerId, scope), () => {
      const current = latest.current;
      if (!ownerId || identity !== JSON.stringify([current.ownerId, current.scope.workspaceId, current.scope.projectId])) return;
      current.notify(current.locale === "ru"
        ? "Локальное восстановление недоступно. Не закрывайте приложение, пока черновик не сохранится на сервере."
        : "Local recovery is unavailable. Keep the app open until your draft is saved to the server.");
    });
  }, [identity]);
  const manager = useMemo(() => api && enabled ? createProductDocAutosave({ api, scope, drafts,
    untitled: () => productDocsCopy(latest.current.locale).untitledPage,
    onError(error) {
      const { locale, notify } = latest.current;
      const message = error && typeof error === "object" && "code" in error && error.code === "PRODUCT_DOC_DRAFT_BLOCKED"
        ? (locale === "ru" ? "Завершите загрузку и исправьте форматирование документа. Изменения остаются в текущем редакторе."
          : "Finish uploads and fix document formatting. Your changes remain in the current editor.")
        : productDocSaveError(error, productDocsCopy(locale), locale);
      notify(message);
    },
  }) : null, [api, enabled, drafts]);
  const revision = useSyncExternalStore(drafts.subscribe ?? idleSubscribe, drafts.revision ?? (() => 0), () => 0);
  useAuthoringSession({ id: `product-docs:${identity}`, get dirty() { return drafts.size > 0; },
    get revision() { return drafts.revision?.() ?? 0; },
    beforeLeave: async () => manager ? manager.flush() : drafts.size === 0 });
  useEffect(() => { manager?.activate(); return () => manager?.dispose(); }, [manager]);
  useEffect(() => {
    if (!manager || !drafts.size) return;
    const timer = setTimeout(() => { void manager.flush(); }, 1_000);
    return () => clearTimeout(timer);
  }, [manager, revision, drafts]);
  return drafts;
}
