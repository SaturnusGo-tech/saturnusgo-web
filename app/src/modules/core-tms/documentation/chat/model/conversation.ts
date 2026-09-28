export const maximumQuestionCharacters = 8000;
export const maximumContextCharacters = 24000;
export const maximumContextMessages = 12;

export type GuideCitation = { articleId: string; sectionId: string; title: string };
export type GuideMessage = { role: "user" | "assistant"; content: string; citations?: GuideCitation[] };
export type GuideAnswer = { answer: string; citations: GuideCitation[]; knowledgeVersion: string };

/** Keep complete recent exchanges; the current question always stays intact. */
export function conversationContext(messages: readonly GuideMessage[], question: string) {
  const context: { role: "user" | "assistant"; content: string }[] = [{ role: "user", content: question }];
  let characters = question.length;
  for (let index = messages.length - 2; index >= 0; index -= 2) {
    const user = messages[index], assistant = messages[index + 1];
    if (user.role !== "user" || assistant.role !== "assistant") continue;
    const pair = [user, assistant].map(message => ({ role: message.role, content: message.content.slice(0, maximumQuestionCharacters) }));
    const length = pair.reduce((total, message) => total + message.content.length, 0);
    if (context.length + 2 > maximumContextMessages || characters + length > maximumContextCharacters) break;
    context.unshift(...pair); characters += length;
  }
  return context;
}
