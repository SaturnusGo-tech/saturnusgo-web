import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { customFieldError } from "../../application/field-errors";
import { saveCustomField, transitionCustomField } from "../../data/custom-field-api";
import type { CustomFieldScope, CustomFieldDefinition, CustomFieldDraft } from "../../model/custom-field";
export function useCustomFieldWrite(scope: CustomFieldScope, ru: boolean) {
  const http = useTmsHttpClient(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null); const retry = useRef({ payload: "", key: "" });
  useEffect(() => { request.current = null; setPending(false); setError(""); retry.current = { payload: "", key: "" };
    return () => request.current?.abort(); }, [scope.workspaceId, scope.projectId, http]);
  async function execute(payload: string, action: (key: string, signal: AbortSignal) => Promise<CustomFieldDefinition>) {
    if (request.current && !request.current.signal.aborted) return null;
    if (retry.current.payload !== payload) retry.current = { payload, key: crypto.randomUUID() };
    const controller = new AbortController(); request.current = controller; setPending(true); setError("");
    try { const field = await action(retry.current.key, controller.signal); if (controller.signal.aborted) return null;
      retry.current = { payload: "", key: "" }; return field;
    } catch (failure) { if (!controller.signal.aborted) setError(customFieldError(failure, ru)); return null; }
    finally { if (!controller.signal.aborted) setPending(false); controller.abort(); }
  }
  return { pending, error, clearError: () => setError(""),
    save: (draft: CustomFieldDraft, field: CustomFieldDefinition | null) => execute(JSON.stringify(["save", field?.id, field?.rowVersion, draft]),
      (key, signal) => saveCustomField(http, scope, draft, field, key, signal)),
    transition: (field: CustomFieldDefinition, action: "archive" | "restore") => execute(JSON.stringify([action, field.id, field.rowVersion]),
      (key, signal) => transitionCustomField(http, scope, field, action, key, signal)),
  };
}
