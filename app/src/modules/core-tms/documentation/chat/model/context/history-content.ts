import type { DocArticle } from "../../../model/article";
import type { GuideMessage } from "../conversation";
import { visibleGuideVisuals } from "../visuals/visible-visuals";

/** Image references are conversational context only; guide text remains server-owned knowledge. */
export function historyContent(message: GuideMessage, limit: number, articles?: ReadonlyMap<string, DocArticle>) {
  if (message.role !== "assistant" || !articles || !message.visuals?.length) return message.content.slice(0, limit);
  const images = visibleGuideVisuals(message.visuals, articles).flatMap(visual => visual.steps.map(step => ({
    articleId: visual.articleId, sectionId: visual.sectionId, mediaId: step.id, title: step.title, instruction: step.instruction,
  })));
  if (!images.length) return message.content.slice(0, limit);
  let titleLimit = 120, instructionLimit = 260, metadata = "";
  do {
    const ordered = images.map((image, index) => ({ position: index + 1, articleId: image.articleId,
      sectionId: image.sectionId, mediaId: image.mediaId, title: image.title.replace(/https?:\/\/[^\s)]+/gi, "[link]").slice(0, titleLimit),
      instruction: image.instruction.replace(/https?:\/\/[^\s)]+/gi, "[link]").slice(0, instructionLimit) }));
    metadata = `[Displayed guide images: context only]\n${JSON.stringify(ordered)}\n[/Displayed guide images]`;
    if (metadata.length <= 5000) break;
    titleLimit = Math.floor(titleLimit / 2); instructionLimit = Math.floor(instructionLimit / 2);
  } while (titleLimit || instructionLimit);
  if (metadata.length > 5000) return message.content.slice(0, limit);
  return `${message.content.slice(0, Math.max(0, limit - metadata.length - 2))}\n\n${metadata}`;
}
