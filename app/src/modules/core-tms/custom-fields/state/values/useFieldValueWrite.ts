import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { customFieldError, customValueConflict, type ValueConflict } from "../../application/field-errors";
import { saveCustomFieldValue, transitionCustomFieldValue } from "../../data/custom-field-api";
import type { CustomFieldScope, CustomFieldValue, CustomFieldValueDraft } from "../../model/custom-field";
export function useFieldValueWrite(scope: CustomFieldScope, fieldId: string, ru: boolean) {
  const http = useTmsHttpClient(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const [conflict, setConflict] = useState<ValueConflict | null>(null);
  const request = useRef<AbortController | null>(null); const retry = useRef({ payload: "", key: "" });
  useEffect(() => { request.current = null; setPending(false); setError(""); setConflict(null); retry.current = { payload: "", key: "" };
    return () => request.current?.abort(); }, [scope.workspaceId, scope.projectId, fieldId, http]);
  async function execute(payload: string, task: (key: string, signal: AbortSignal) => Promise<CustomFieldValue>) {
    if (request.current && !request.current.signal.aborted) return null;
    if (retry.current.payload !== payload) retry.current = { payload, key: crypto.randomUUID() };
    const controller = new AbortController(); request.current = controller; setPending(true); setError(""); setConflict(null);
    try {
      const value = await task(retry.current.key, controller.signal);
      if (controller.signal.aborted) return null;
      retry.current = { payload: "", key: "" }; return value;
    } catch (failure) {
      if (!controller.signal.aborted) { const next = customValueConflict(failure); setConflict(next); if (!next) setError(customFieldError(failure, ru)); }
      return null;
    } finally { if (!controller.signal.aborted) setPending(false); controller.abort(); }
  }
  return { pending, error, conflict, reset: () => { setError(""); setConflict(null); },
    save: (draft: CustomFieldValueDraft, value: CustomFieldValue | null = null) => execute(JSON.stringify(["save", value?.id, value?.rowVersion, draft]),
      (key, signal) => saveCustomFieldValue(http, scope, fieldId, draft, value, key, signal)),
    transition: (value: CustomFieldValue, action: "archive" | "restore") => execute(JSON.stringify([action, value.id, value.rowVersion]),
      (key, signal) => transitionCustomFieldValue(http, scope, value, action, key, signal)),
  };
}
