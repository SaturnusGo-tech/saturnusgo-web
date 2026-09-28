import { TmsApiError } from "../../../../../../core/tms/transport/http";
import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { GuideAnswer } from "../../model/conversation";
import { maximumAnswerCharacters } from "../../model/conversation";
import { validateGuideAnswer } from "../validate-answer";

function streamEvent(value: unknown): components["schemas"]["DocumentationChatStreamEvent"] {
  if (!value || typeof value !== "object") throw new Error("Invalid documentation stream event");
  const data = value as Record<string, unknown>;
  if (data.type === "text_delta" && typeof data.delta === "string") return { type: "text_delta", delta: data.delta };
  if (data.type === "complete") return { type: "complete", data: validateGuideAnswer(data.data) };
  if (data.type === "error" && data.error && typeof data.error === "object") {
    const error = data.error as Record<string, unknown>;
    if ((error.code === "AI_GUIDE_UNAVAILABLE" || error.code === "AI_GUIDE_RATE_LIMITED" || error.code === "AI_GUIDE_OUTPUT_INVALID")
      && typeof error.message === "string" && typeof error.requestId === "string") {
      return { type: "error", error: { code: error.code, message: error.message, requestId: error.requestId } };
    }
  }
  throw new Error("Invalid documentation stream event");
}

export async function readGuideStream(response: Response, signal: AbortSignal, onDelta: (text: string) => void): Promise<GuideAnswer> {
  if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw new Error("Expected documentation event stream");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", eventLines: string[] = [], eventCharacters = 0, totalCharacters = 0, textCharacters = 0;
  let result: GuideAnswer | null = null;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  function dispatch() {
    if (!eventLines.length) return;
    const data = streamEvent(JSON.parse(eventLines.join("\n")));
    eventLines = []; eventCharacters = 0;
    if (data.type === "text_delta") {
      textCharacters += data.delta.length;
      if (textCharacters > maximumAnswerCharacters) throw new Error("Documentation answer exceeds display limit");
      if (data.delta) onDelta(data.delta);
    } else if (data.type === "complete") result = data.data;
    else if (data.type === "error") {
      const error = data.error;
      const status = error.code === "AI_GUIDE_RATE_LIMITED" ? 429 : error.code === "AI_GUIDE_OUTPUT_INVALID" ? 422 : 503;
      throw new TmsApiError("Documentation stream failed", status, error.requestId);
    } else throw new Error("Invalid documentation stream event");
  }
  function line(value: string) {
    if (!value) { dispatch(); return; }
    if (value.startsWith("data:")) {
      const text = value.slice(5).replace(/^ /, ""); eventCharacters += text.length;
      if (eventCharacters > 500000) throw new Error("Documentation stream event too large");
      eventLines.push(text);
    }
  }
  try {
    signal.throwIfAborted();
    while (true) {
      const part = await reader.read(); signal.throwIfAborted();
      buffer += decoder.decode(part.value, { stream: !part.done }); totalCharacters += part.value?.byteLength ?? 0;
      if (buffer.length > 500000 || totalCharacters > 1000000) throw new Error("Documentation stream too large");
      let end = buffer.indexOf("\n");
      while (end !== -1) {
        line(buffer.slice(0, end).replace(/\r$/, "")); buffer = buffer.slice(end + 1);
        if (result) return result;
        end = buffer.indexOf("\n");
      }
      if (part.done) {
        if (buffer) line(buffer.replace(/\r$/, "")); dispatch();
        if (result) return result;
        throw new Error("Documentation stream ended before a validated answer");
      }
    }
  } finally {
    signal.removeEventListener("abort", abort);
    await reader.cancel().catch(() => {}); reader.releaseLock();
  }
}
