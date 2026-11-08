"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { klipyMediaUrl } from "../../../folders/gif-gallery/model/klipy-urls";
import type { FolderAppearance, FolderIconId } from "../../../folders/model/appearance/folder-appearance";
import { folderIcons } from "../../../folders/presentation/appearance/icons/folder-icons";
import type { ProductDocNode, ProductDocScope } from "../../domain/product-docs";
import { defaultSectionIcon, isSectionIconId } from "../../domain/appearance/section-icons";

function read(key: string, useLegacy: boolean) {
  if (!useLegacy) return null;
  try { return window.localStorage.getItem(key); }
  catch { return null; }
}

function parse(value: string | null): FolderAppearance {
  if (isSectionIconId(value)) return { kind: "icon", iconId: value, color: null };
  if (!value) return null;
  try {
    const item = JSON.parse(value) as Partial<NonNullable<FolderAppearance>> | null;
    if (item?.kind === "icon" && typeof item.iconId === "string" && Object.prototype.hasOwnProperty.call(folderIcons, item.iconId)) {
      return { kind: "icon", iconId: item.iconId as FolderIconId,
        color: typeof item.color === "string" && /^#[\da-f]{6}$/i.test(item.color) ? item.color : null };
    }
    if (item?.kind === "emoji" && typeof item.emoji === "string" && item.emoji.length <= 64) {
      return { kind: "emoji", emoji: item.emoji };
    }
    if (item?.kind === "image" && typeof item.assetId === "string" && item.assetId.length <= 200) {
      return { kind: "image", assetId: item.assetId };
    }
    if (item?.kind === "gif" && item.provider === "klipy" && typeof item.id === "string") {
      return { kind: "gif", provider: "klipy", id: item.id, url: klipyMediaUrl(item.url) };
    }
  } catch { /* Ignore invalid preferences and use the inferred icon. */ }
  return null;
}

export function useSectionAppearance(scope: ProductDocScope, node: ProductDocNode) {
  const subject = useOptionalTmsSession()?.subject ?? null;
  const key = "falcon.product-doc-section-icon.v1:" + JSON.stringify([
    subject, scope.workspaceId, scope.projectId, node.id,
  ]);
  const useLegacy = subject !== null && node.appearance === undefined;
  const subscribe = useCallback((notify: () => void) => {
    if (!useLegacy) return () => undefined;
    function onStorage(event: StorageEvent) {
      if (event.key === key || event.key === null) notify();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, useLegacy]);
  const value = useSyncExternalStore(subscribe, () => read(key, useLegacy), () => null);
  const legacy = useMemo(() => parse(value), [value]);
  const appearance = node.appearance === undefined ? legacy : node.appearance;
  return { appearance, automatic: defaultSectionIcon(node.title) };
}
