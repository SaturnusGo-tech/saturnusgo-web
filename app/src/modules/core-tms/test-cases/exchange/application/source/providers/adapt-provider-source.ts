import { rejectPartialProvider } from "./guards/reject-partial-provider";
import { adaptTrelloBoard } from "./trello-board";
export function adaptProviderSource(source: unknown): unknown {
  if (!source || typeof source !== "object" || Array.isArray(source)) return source;
  const object = source as Record<string, unknown>;
  rejectPartialProvider(object);
  if (typeof object.id === "string" && typeof object.name === "string" && Array.isArray(object.cards) && Array.isArray(object.lists) && Array.isArray(object.checklists)) {
    return adaptTrelloBoard(object);
  }
  return source;
}
