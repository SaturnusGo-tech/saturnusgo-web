import type { GuideAnswer, GuideVisual } from "../model/conversation";
import { maximumAnswerCharacters, maximumAnswerImages } from "../model/conversation";

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function isVisual(value: unknown): value is GuideVisual {
  return isRecord(value) && typeof value.articleId === "string" && typeof value.sectionId === "string"
    && (value.layout === "steps" || value.layout === "gallery") && Array.isArray(value.items) && value.items.length >= 1 && value.items.length <= maximumAnswerImages
    && value.items.every(item => isRecord(item) && ["id", "title", "instruction", "result", "src", "alt"].every(key => typeof item[key] === "string"));
}
export function validateGuideAnswer(value: unknown): GuideAnswer {
  if (!isRecord(value) || typeof value.answer !== "string" || !value.answer.trim() || value.answer.length > maximumAnswerCharacters
    || !Array.isArray(value.citations) || value.citations.length > 8 || typeof value.knowledgeVersion !== "string"
    || value.citations.some(citation => !isRecord(citation)
      || typeof citation.articleId !== "string" || typeof citation.sectionId !== "string" || typeof citation.title !== "string")
    || (value.visuals !== undefined && (!Array.isArray(value.visuals) || value.visuals.length > 8 || !value.visuals.every(isVisual)
      || value.visuals.reduce((sum, visual) => sum + visual.items.length, 0) > maximumAnswerImages))) {
    throw new Error("Invalid documentation answer");
  }
  return { answer: value.answer.trim(), citations: value.citations as GuideAnswer["citations"], knowledgeVersion: value.knowledgeVersion,
    ...(value.visuals ? { visuals: value.visuals as GuideVisual[] } : {}) };
}
