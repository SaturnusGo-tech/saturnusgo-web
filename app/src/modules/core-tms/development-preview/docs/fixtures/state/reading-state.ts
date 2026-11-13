import type { ProductDocDetail } from "../../../../product-docs/domain/product-docs";
import { createReadingSamples } from "../samples/reading-samples";
import type { ReadingRole } from "../reading-access";

export type ReadingDoc = ProductDocDetail & {
  lifecycleVersion: number; canArchive: boolean; canDelete: boolean; deletedAt?: string;
};
export type ReadingState = ReturnType<typeof createReadingState>;

export function createReadingState(ru: boolean, role: ReadingRole, notify: (action: string, id: string) => void = () => {}) {
  const sample = createReadingSamples(ru), t = (en: string, russian: string) => ru ? russian : en;
  const docs: ReadingDoc[] = sample.docs.map(doc => ({ ...doc, lifecycleVersion: doc.draftVersion, canArchive: true, canDelete: true }));
  const publications = new Map<string, ReadingDoc>();
  const node = (id: string, parentId: string | null, kind: "page" | "folder", title: string, published = false): ReadingDoc => ({
    id, parentId, kind, title, draftVersion: 1, lifecycleVersion: 1, publishedVersion: published ? 1 : null,
    version: published ? 1 : null, canEdit: true, canPublish: true, canArchive: true, canDelete: true,
    sections: kind === "page" ? [{ id: "body", title: "", markdown: `${title} · local sample` }] : [],
  });
  docs.push(node("section", null, "folder", t("QA lifecycle section", "Раздел проверки жизненного цикла")),
    node("section-page", "section", "page", t("Published child", "Опубликованная дочерняя страница"), true),
    node("untitled", "section", "page", t("Untitled", "Без названия")),
    node("untitled-root", null, "page", t("Untitled", "Без названия")),
    { ...node("archived-child", "section", "page", t("Independently archived child", "Отдельно архивированная страница"), true),
      archivedAt: "2026-11-12T04:00:00Z" });
  for (const doc of docs) {
    if (doc.kind !== "page" || doc.publishedVersion === null) continue;
    for (let version = 1; version <= doc.publishedVersion; version++) {
      const snapshot = structuredClone(doc);
      snapshot.version = version; snapshot.draftVersion = version;
      if (version < doc.publishedVersion) snapshot.sections = [{ id: "history", title: "", markdown: t("Exact historical version one.", "Точная историческая версия один.") }];
      publications.set(`${doc.id}:${version}`, snapshot);
    }
  }
  const calendar = docs.find(doc => doc.id === "calendar")!;
  calendar.title = t("PRIVATE DRAFT · Host calendar", "ПРИВАТНЫЙ ЧЕРНОВИК · Календарь хоста");
  calendar.sections = [...calendar.sections, { id: "private", title: "PRIVATE", markdown: "PRIVATE_DRAFT_ONLY" }];
  const archiveRoots = new Map<string, string>([["archived-child", "archived-child"]]);
  const deleteReceipts = new Map<string, { fingerprint: string; result: { draftVersion: number; deletedAt: string; affectedCount: number } }>();
  return { role, docs, publications, archiveRoots, deleteReceipts, cases: sample.cases, notify, conflictNext: false,
    writes: [] as { action: string; id: string }[] };
}
