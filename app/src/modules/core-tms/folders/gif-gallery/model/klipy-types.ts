import type { FolderAppearance } from "../../model/appearance/folder-appearance";

export type KlipyAppearance = Extract<FolderAppearance, { kind: "gif" }>;
export type KlipyItem = { appearance: KlipyAppearance; title: string; description: string; credit: string };
export type KlipyPage = { items: KlipyItem[]; next: string };
export type KlipyFailure = "access" | "rate" | "network" | "response";
export class KlipyError extends Error {
  constructor(readonly kind: KlipyFailure, readonly retryAfter = 0) { super("KLIPY request could not complete."); }
}
