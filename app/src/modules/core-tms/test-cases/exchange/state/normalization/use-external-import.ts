import { useEffect, useRef, useState } from "react";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { externalImportClient } from "../../data/normalization/external-import-client";
import { normalizeExternalImport } from "../../application/normalization/normalize-external-import";
import type { ExternalImportCheckpoint } from "../../model/external/external-import";
import { TEST_CASE_EXCHANGE_SCHEMA, type TestCaseExchangeDocument } from "../../model/test-case-exchange";
export function useExternalImport(http: TmsHttpClient, project: { id: string; key: string; name: string }, locale: "ru" | "en", folders: string[], onReady: (document: TestCaseExchangeDocument) => void) {
  const [source, setSource] = useState<unknown>(undefined);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [reviewed, setReviewed] = useState(false); const [, update] = useState(0);
  const checkpoint = useRef<ExternalImportCheckpoint>({ records: null, processed: 0, cases: [], issues: [] });
  const abort = useRef<AbortController | null>(null);
  const done = useRef(onReady); done.current = onReady;
  function reset(next: unknown = undefined) {
    abort.current?.abort(); abort.current = null;
    checkpoint.current = { records: null, processed: 0, cases: [], issues: [] };
    setSource(next); setBusy(false); setError(""); setReviewed(false);
  }
  useEffect(() => { reset(); return () => abort.current?.abort(); }, [http, project.id]);
  async function convert() {
    if (source === undefined || busy) return;
    const controller = new AbortController(); abort.current = controller; setBusy(true); setError("");
    try {
      await normalizeExternalImport(externalImportClient(http, project, locale), source, checkpoint.current, folders, controller.signal, () => { if (abort.current === controller && !controller.signal.aborted) update(n => n + 1); });
      if (abort.current !== controller || controller.signal.aborted) return;
      done.current({ schemaVersion: TEST_CASE_EXCHANGE_SCHEMA, project: { key: project.key, name: project.name }, exportedAt: new Date().toISOString(),
        metadata: { convertedBy: "OpenRouter", recognized: checkpoint.current.records?.length, excluded: checkpoint.current.issues },
        testCases: checkpoint.current.cases.map(c => c.value), folders: [...new Set(checkpoint.current.cases.map(c => c.value.folderPath))] });
    } catch (failure) {
      if (abort.current === controller && !controller.signal.aborted) {
        const code = typeof failure === "object" && failure !== null && "code" in failure ? String(failure.code) : failure instanceof Error ? failure.message : "";
        setError(code.includes("IMPORT_LIMIT") ? (locale === "ru" ? "Слишком большой фрагмент. Разделите файл на части." : "This section is too large. Split the file into smaller parts.") :
          locale === "ru" ? "Не удалось завершить преобразование. Можно продолжить с последнего обработанного кейса." : "Conversion could not finish. You can resume from the last processed case.");
      }
    } finally { if (abort.current === controller) setBusy(false); }
  }
  return { active: source !== undefined, busy, error, reviewed, setReviewed, reset, convert,
    progress: checkpoint.current, stop: () => { abort.current?.abort(); setBusy(false); } };
}
