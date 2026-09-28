import { TmsApiError } from "../../../../../../core/tms/transport/http";
import type { components } from "../../../../../../core/tms/generated/tms-api";
import { validateGuideAnswer } from "../../data/validate-answer";
import { maximumAnswerCharacters } from "../../model/conversation";
import type { GuideChatSummary, GuideChatTurn } from "../model/history";

type Event = components["schemas"]["DocumentationPersistentChatStreamEvent"];
type Saved = { chat: GuideChatSummary; turn: GuideChatTurn };
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
function saved(value: Record<string, unknown>): value is Record<string, unknown> & Saved {
  return record(value.chat) && typeof value.chat.id === "string" && typeof value.chat.version === "number"
    && (value.chat.locale === "ru" || value.chat.locale === "en") && record(value.turn)
    && typeof value.turn.id === "string" && typeof value.turn.question === "string"
    && ["pending", "completed", "failed", "cancelled"].includes(String(value.turn.state));
}
export async function readPersistentGuideStream(response: Response, signal: AbortSignal,
  callbacks: { accepted(value: Saved): void; delta(value: string): void }): Promise<Saved> {
  if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw new Error("Expected guide stream");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", lines: string[] = [], total = 0, characters = 0, accepted: Saved | null = null, complete: Saved | null = null;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  function dispatch() {
    if (!lines.length) return;
    const value: unknown = JSON.parse(lines.join("\n")); lines = [];
    if (!record(value)) throw new Error("Invalid guide event");
    const type: Event["type"] = value.type as Event["type"];
    if (type === "accepted" && saved(value) && !accepted) {
      accepted = { chat: value.chat, turn: value.turn }; callbacks.accepted(accepted);
    } else if (type === "text_delta" && accepted && typeof value.delta === "string") {
      characters += value.delta.length;
      if (characters > maximumAnswerCharacters) throw new Error("Guide answer exceeds limit");
      callbacks.delta(value.delta);
    } else if (type === "complete" && accepted && saved(value)
      && value.chat.id === accepted.chat.id && value.turn.id === accepted.turn.id && value.turn.state === "completed") {
      const answer = validateGuideAnswer(value.data);
      if (JSON.stringify(validateGuideAnswer(value.turn.answer)) !== JSON.stringify(answer)) throw new Error("Saved answer differs from completion");
      complete = { chat: value.chat, turn: { ...value.turn, answer } };
    } else if (type === "error" && record(value.error) && typeof value.error.code === "string") {
      const code = value.error.code;
      const status = /LIMIT/.test(code) ? 429 : /ACCESS/.test(code) ? 403 : /OUTPUT_INVALID/.test(code) ? 422 : /CONFLICT|PENDING|CANCELLED|FAILED/.test(code) ? 409 : 503;
      throw new TmsApiError("Guide request failed", status, typeof value.error.requestId === "string" ? value.error.requestId : null, code as TmsApiError["code"]);
    } else throw new Error("Invalid guide stream event");
  }
  function line(value: string) {
    if (!value) dispatch();
    else if (value.startsWith("data:")) lines.push(value.slice(5).replace(/^ /, ""));
  }
  try {
    signal.throwIfAborted();
    while (true) {
      const chunk = await reader.read(); signal.throwIfAborted(); total += chunk.value?.byteLength ?? 0;
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      if (total > 1000000 || buffer.length > 500000) throw new Error("Guide stream exceeds limit");
      let end = buffer.indexOf("\n");
      while (end >= 0) {
        line(buffer.slice(0, end).replace(/\r$/, "")); buffer = buffer.slice(end + 1);
        if (complete) return complete;
        end = buffer.indexOf("\n");
      }
      if (chunk.done) {
        if (buffer) line(buffer.replace(/\r$/, "")); dispatch();
        if (complete) return complete;
        throw new Error("Guide stream ended before persistence confirmation");
      }
    }
  } finally {
    signal.removeEventListener("abort", abort); await reader.cancel().catch(() => {}); reader.releaseLock();
  }
}
