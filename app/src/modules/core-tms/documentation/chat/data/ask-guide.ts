import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { components } from "../../../../../core/tms/generated/tms-api";
import type { GuideAnswer, GuideMessage } from "../model/conversation";

export async function askGuide(http: TmsHttpClient, workspaceId: string, locale: "ru" | "en",
  messages: Pick<GuideMessage, "role" | "content">[], signal: AbortSignal): Promise<GuideAnswer> {
  const body: components["schemas"]["DocumentationChatRequest"] = { locale, messages };
  const result = await http.mutate<components["schemas"]["DocumentationChatResponse"]["data"]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/ai/documentation-chat`, "POST", body, signal,
  );
  if (!result || typeof result.answer !== "string" || !result.answer.trim() || !Array.isArray(result.citations)
    || typeof result.knowledgeVersion !== "string" || result.citations.some(citation => !citation
      || typeof citation.articleId !== "string" || typeof citation.sectionId !== "string" || typeof citation.title !== "string")) {
    throw new Error("Invalid documentation answer");
  }
  return { ...result, answer: result.answer.trim() };
}

export function guideError(error: unknown): "unavailable" | "forbidden" | "signedOut" | "limited" | "invalid" {
  if (error instanceof TmsApiError) {
    if (error.status === 401) return "signedOut";
    if (error.status === 403) return "forbidden";
    if (error.status === 429) return "limited";
    if (error.status === 400 || error.status === 422) return "invalid";
  }
  return "unavailable";
}
