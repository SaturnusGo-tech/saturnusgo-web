import { useEffect, useRef, useState } from "react";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { externalImportClient } from "../../data/normalization/external-import-client";
import { normalizeExternalImport } from "../../application/normalization/normalize-external-import";
import type { ExternalImportCheckpoint } from "../../model/external/external-import";
import { TEST_CASE_EXCHANGE_SCHEMA, type TestCaseExchangeDocument } from "../../model/test-case-exchange";
export function useExternalImport(http: TmsHttpClient, project: { id: string; key: string; name: string }, locale: "ru" | "en", folders: string[]) {
  const source = useRef<unknown>(undefined);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, update] = useState(0);
  const checkpoint = useRef<ExternalImportCheckpoint>({ records: null, processed: 0, cases: [], issues: [] });
  const abort = useRef<AbortController | null>(null);
  function reset(next: unknown = undefined) {
    abort.current?.abort(); abort.current = null;
    checkpoint.current = { records: null, processed: 0, cases: [], issues: [] };
    source.current = next; setActive(next !== undefined); setBusy(false);
  }
  useEffect(() => { reset(); return () => abort.current?.abort(); }, [http, project.id]);
  async function convert(signal: AbortSignal): Promise<TestCaseExchangeDocument> {
    if (source.current === undefined) throw new Error(locale === "ru" ? "Добавьте JSON с тест-кейсами." : "Add a test-case JSON file.");
    const controller = new AbortController(); abort.current = controller;
    const stop = () => controller.abort();
    signal.addEventListener("abort", stop, { once: true });
    if (signal.aborted) stop();
    setBusy(true);
    try {
      // Failed mappings may be retried; accepted batches stay checkpointed on temporary transport errors.
      if (checkpoint.current.issues.length) checkpoint.current = { records: checkpoint.current.records, processed: 0, cases: [], issues: [] };
      const current = checkpoint.current;
      await normalizeExternalImport(externalImportClient(http, project, locale), source.current, current, folders, controller.signal,
        () => { if (abort.current === controller && !controller.signal.aborted) update(n => n + 1); });
      controller.signal.throwIfAborted();
      if (abort.current !== controller) throw new DOMException("Aborted", "AbortError");
      if (current.issues.length) throw new Error(locale === "ru"
        ? `Не удалось прочитать ${current.issues.length} кейс(ов). Ничего не импортировано. Проверьте записи: ${current.issues.slice(0, 5).map(i => i.sourcePath).join(", ")}.`
        : `Could not read ${current.issues.length} case(s). Nothing was imported. Check records: ${current.issues.slice(0, 5).map(i => i.sourcePath).join(", ")}.`);
      if (!current.cases.length) throw new Error(locale === "ru" ? "В файле не найдены тест-кейсы." : "No test cases found in this file.");
      return { schemaVersion: TEST_CASE_EXCHANGE_SCHEMA, project: { key: project.key, name: project.name }, exportedAt: new Date().toISOString(),
        metadata: { recognized: current.records?.length }, testCases: current.cases.map(c => c.value),
        folders: [...new Set(current.cases.map(c => c.value.folderPath))] };
    } finally {
      signal.removeEventListener("abort", stop);
      if (abort.current === controller) { abort.current = null; setBusy(false); }
    }
  }
  return { active, busy, reset, convert, progress: checkpoint.current,
    stop: () => { abort.current?.abort(); setBusy(false); } };
}
