import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { components } from "../../../../../core/tms/generated/tms-api";
import { wavBase64 } from "../model/audio";

export async function transcribeDictation(http: TmsHttpClient, workspaceId: string, wav: ArrayBuffer,
  language: "ru" | "en", signal: AbortSignal) {
  signal.throwIfAborted();
  const body: components["schemas"]["DictationRequest"] = { audio: wavBase64(wav), language };
  const result = await http.mutate<components["schemas"]["DictationResult"]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/ai/dictation`, "POST", body, signal,
  );
  if (!result || typeof result.text !== "string" || !result.text.trim()) {
    throw new TmsApiError("No speech recognized", 422, null, "DICTATION_EMPTY");
  }
  return result.text.trim();
}
