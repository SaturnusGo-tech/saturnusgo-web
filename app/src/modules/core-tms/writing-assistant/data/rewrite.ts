import { TmsApiError, type TmsHttpClient } from "../../../../core/tms/transport/http";
import type { WritingActionKind } from "../model/target";
import type { components } from "../../../../core/tms/generated/tms-api";

export async function rewriteText(http: TmsHttpClient, workspaceId: string, text: string,
  action: WritingActionKind, instruction: string, signal: AbortSignal) {
  const body: components["schemas"]["MarkdownWritingRequest"] = { text, action, ...(action === "custom" ? { instruction: instruction.trim() } : {}) };
  const result = await http.mutate<components["schemas"]["MarkdownWritingResponse"]["data"]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/ai/text-rewrite`, "POST",
    body, signal,
  );
  if (!result || typeof result.markdown !== "string" || !result.markdown.trim()) throw new Error("empty writing response");
  return result.markdown;
}

export function writingError(error: unknown, ru: boolean) {
  if (error instanceof TmsApiError) {
    if (error.status === 429) return ru ? "Слишком много запросов. Попробуйте чуть позже." : "Too many requests. Try again shortly.";
    if (error.status === 403) return ru ? "У вас нет доступа к редактированию в этом пространстве." : "You do not have editing access in this workspace.";
    if (error.status === 401) return ru ? "Войдите в аккаунт и повторите запрос." : "Sign in and try again.";
    if (error.status === 422) return ru ? "Не удалось подготовить ответ. Попробуйте уточнить запрос." : "Could not prepare a response. Try clarifying your request.";
  }
  return ru ? "Falcon AI сейчас недоступен. Попробуйте ещё раз. Ваш текст сохранён." : "Falcon AI is unavailable. Try again. Your text is unchanged.";
}
