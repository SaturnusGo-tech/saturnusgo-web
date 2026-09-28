import type { components } from "../../../../../core/tms/generated/tms-api";
import type { DocArticle } from "../../model/article";
import { historyContent } from "./context/history-content";

export const maximumQuestionCharacters = 8000;
export const maximumContextCharacters = 32000;
export const maximumContextMessages = 20;
export const maximumAnswerCharacters = 16000;
export const maximumAnswerImages = 8;

export type GuideCitation = components["schemas"]["DocumentationChatCitation"];
export type GuideVisualItem = components["schemas"]["DocumentationChatMedia"];
export type GuideVisual = components["schemas"]["DocumentationChatVisual"];
export type GuideMessage = { role: "user" | "assistant"; content: string; citations?: GuideCitation[]; visuals?: GuideVisual[] };
export type GuideAnswer = components["schemas"]["DocumentationChatResult"];

/** Keep the first exchange and complete recent exchanges when the history exceeds the request budget. */
export function conversationContext(messages: readonly GuideMessage[], question: string, articles?: ReadonlyMap<string, DocArticle>) {
  const history = messages.map(message => ({ role: message.role, content: historyContent(message, maximumQuestionCharacters, articles) }));
  if (history.length + 1 <= maximumContextMessages
    && history.reduce((sum, message) => sum + message.content.length, question.length) <= maximumContextCharacters) {
    return [...history, { role: "user" as const, content: question }];
  }
  const context: { role: "user" | "assistant"; content: string }[] = [{ role: "user", content: question }];
  const opening = history[0]?.role === "user" && history[1]?.role === "assistant" ? history.slice(0, 2) : [];
  let characters = question.length + opening.reduce((sum, message) => sum + message.content.length, 0);
  for (let index = history.length - 2; index >= opening.length; index -= 2) {
    const user = history[index], assistant = history[index + 1];
    if (user.role !== "user" || assistant.role !== "assistant") continue;
    const pair = [user, assistant];
    const length = pair.reduce((total, message) => total + message.content.length, 0);
    if (context.length + 2 + opening.length > maximumContextMessages || characters + length > maximumContextCharacters) break;
    context.unshift(...pair); characters += length;
  }
  context.unshift(...opening);
  return context;
}
