import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { components } from "../../../../../core/tms/generated/tms-api";
import type { GuideAnswer, GuideMessage } from "../model/conversation";
import { validateGuideAnswer } from "./validate-answer";
import { readGuideStream } from "./stream/read-guide-stream";

export async function askGuide(http: TmsHttpClient, workspaceId: string, locale: "ru" | "en",
  messages: Pick<GuideMessage, "role" | "content">[], signal: AbortSignal, onDelta: (text: string) => void = () => {}): Promise<GuideAnswer> {
  const body: components["schemas"]["DocumentationChatRequest"] = { locale, messages };
  if (http.stream) {
    const response = await http.stream(`/workspaces/${encodeURIComponent(workspaceId)}/ai/documentation-chat/stream`, body, signal);
    return readGuideStream(response, signal, onDelta);
  }
  const result = await http.mutate<components["schemas"]["DocumentationChatResponse"]["data"]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/ai/documentation-chat`, "POST", body, signal,
  );
  return validateGuideAnswer(result);
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
