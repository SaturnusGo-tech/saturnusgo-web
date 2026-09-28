import type { components } from "../../../../../core/tms/generated/tms-api";

export const maximumQuestionCharacters = 8000;
export const maximumContextCharacters = 32000;
export const maximumContextMessages = 20;
export const maximumAnswerCharacters = 16000;
export const maximumAnswerImages = 8;

export type GuideCitation = components["schemas"]["DocumentationChatCitation"];
export type GuideVisualItem = components["schemas"]["DocumentationChatMedia"];
export type GuideVisual = components["schemas"]["DocumentationChatVisual"];
export type GuideMessage = { role: "user" | "assistant"; content: string; citations?: GuideCitation[]; visuals?: GuideVisual[];
  id?: string; turnId?: string; locale?: "ru" | "en" };
export type GuideAnswer = components["schemas"]["DocumentationChatResult"];
