import type { DocArticle } from "../../../model/article";
import { documentationSectionMedia } from "../../../model/visual/guide-media";
import { matchesHistoricalGuideMedia } from "../../../model/visual/compatibility/historical-media";
import type { ScreenshotStep } from "../../../model/visual/walkthrough";
import type { GuideVisual } from "../conversation";

export type VisibleGuideVisual = { key: string; title: string; articleId: string; sectionId: string;
  layout: "steps" | "gallery"; steps: (ScreenshotStep & { id: string })[] };

/** Resolve content and dimensions locally; model-authored text and URLs never become image attributes. */
export function visibleGuideVisuals(visuals: readonly GuideVisual[] | undefined, articles: ReadonlyMap<string, DocArticle>): VisibleGuideVisual[] {
  const seen = new Set<string>();
  return (visuals ?? []).flatMap(visual => {
    const article = articles.get(visual.articleId), section = article?.sections.find(item => item.id === visual.sectionId);
    const key = `${visual.articleId}:${visual.sectionId}`;
    if (!article || !section || seen.has(key)) return [];
    const sourceSteps = section.blocks.flatMap(block => block.kind === "walkthrough" ? block.steps : []);
    const media = documentationSectionMedia(section);
    const steps = media.flatMap(item => {
      const source = sourceSteps.find(step => step.image.src === item.src);
      const selected = visual.items.some(supplied => (supplied.id === item.id && supplied.src === item.src)
        || matchesHistoricalGuideMedia(article.id, section.id, supplied, item));
      if (!source || !selected) return [];
      return [{ id: item.id, title: item.title, instruction: item.instruction, result: item.result,
        image: { src: item.src, alt: item.alt, width: source.image.width, height: source.image.height } }];
    });
    if (!steps.length) return [];
    seen.add(key);
    return [{ key, title: section.title, articleId: article.id, sectionId: section.id, layout: visual.layout, steps }];
  });
}
