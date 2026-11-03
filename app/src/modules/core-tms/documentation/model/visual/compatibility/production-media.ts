import type { DocumentationMedia } from "../guide-media";
import { documentationMediaLocale } from "../guide-media";
import english from "./production-aliases-en.json";
import russian from "./production-aliases-ru.json";

export type ProductionMediaAlias = {
  locale: "en" | "ru"; articleId: string; sectionId: string;
  id: string; src: string; currentId: string; currentSrc: string;
};

export function matchesProductionGuideMedia(articleId: string, sectionId: string,
  supplied: Pick<DocumentationMedia, "id" | "src">, canonical: DocumentationMedia,
  aliases: readonly ProductionMediaAlias[] = [...english, ...russian] as ProductionMediaAlias[]): boolean {
  return aliases.some(alias => alias.articleId === articleId && alias.sectionId === sectionId
    && alias.locale === documentationMediaLocale(canonical.src)
    && alias.id === supplied.id && alias.src === supplied.src
    && alias.currentId === canonical.id && alias.currentSrc === canonical.src);
}
