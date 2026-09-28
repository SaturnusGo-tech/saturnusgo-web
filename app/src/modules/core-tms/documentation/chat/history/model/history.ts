import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { GuideMessage } from "../../model/conversation";

export type GuideChatSummary = components["schemas"]["DocumentationChatSummary"];
export type GuideChatTurn = components["schemas"]["DocumentationChatTurn"];
export type GuideChatShare = components["schemas"]["DocumentationChatShare"];
export type GuideSharedAnswer = components["schemas"]["DocumentationSharedAnswer"];
export type GuidePage<T> = { items: T[]; nextCursor: string | null };

export function mergeTurns(current: readonly GuideChatTurn[], incoming: readonly GuideChatTurn[]) {
  return [...new Map([...current, ...incoming].map(turn => [turn.id, turn])).values()]
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id));
}
export function turnMessages(turns: readonly GuideChatTurn[], locale: "ru" | "en"): GuideMessage[] {
  return turns.flatMap(turn => {
    const question: GuideMessage = { role: "user", content: turn.question, id: `${turn.id}:question`, turnId: turn.id, locale };
    return turn.state === "completed" && turn.answer ? [question, { role: "assistant" as const, content: turn.answer.answer,
      citations: turn.answer.citations, visuals: turn.answer.visuals, id: turn.id, turnId: turn.id, locale }] : [question];
  });
}
