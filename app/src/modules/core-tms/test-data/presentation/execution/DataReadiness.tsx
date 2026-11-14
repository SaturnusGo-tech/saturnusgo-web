import { Button } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useTestData } from "../../application/context/TestDataContext";
import type { DataFinding } from "../../model/bindings/binding";
import { DataFeedback } from "../shared/DataFeedback";
import { DataValidation } from "../validation/DataValidation";
import css from "../shared/data.module.css";
type Result = { readonly owner: object; readonly loading: boolean; readonly error: boolean; readonly valid: boolean; readonly errors: readonly DataFinding[]; readonly warnings: readonly DataFinding[] };
export function DataReadiness({ runId, itemId, ru, refreshVersion }: { runId: string; itemId: string; ru: boolean; refreshVersion: string }) {
  const feature = useTestData(), [result, setResult] = useState<Result | null>(null);
  const [retry, setRetry] = useState(0);
  const owner = useMemo(() => ({}), [feature, feature?.actorId, feature?.projectId, runId, itemId, refreshVersion, retry]);
  const state = result?.owner === owner ? result : null;
  useEffect(() => {
    if (!feature) return;
    const controller = new AbortController();
    setResult({ owner, loading: true, error: false, valid: false, errors: [], warnings: [] });
    void (async () => {
      let after: number | null = null;
      const seen = new Set<number>();
      do {
        const page = await feature.port.preflight(runId, after, controller.signal);
        const item = page.items.find(item => item.itemId === itemId);
        if (item) { if (!controller.signal.aborted) setResult({ owner, loading: false, error: false, valid: item.valid, errors: item.errors, warnings: item.warnings }); return; }
        after = page.nextAfter;
        if (after !== null && seen.has(after)) throw new Error("Repeated preflight cursor");
        if (after !== null) seen.add(after);
      } while (after !== null && !controller.signal.aborted);
      if (!controller.signal.aborted) setResult({ owner, loading: false, error: true, valid: false, errors: [], warnings: [] });
    })().catch(() => { if (!controller.signal.aborted) setResult({ owner, loading: false, error: true, valid: false, errors: [], warnings: [] }); });
    return () => controller.abort();
  }, [owner]);
  if (!feature) return null;
  return <div><DataFeedback loading={!state || state.loading} error={state?.error} ru={ru} retry={() => setRetry(value => value + 1)} />
    {state && !state.loading && !state.error && <><p className={css.status}>{state.valid ? (ru ? "Данные готовы к выполнению" : "Data is ready for execution") : (ru ? "Данные требуют внимания" : "Data needs attention")}</p>
      <DataValidation findings={state.errors} ru={ru} /><p className={css.muted}>{ru ? "Версии будут зафиксированы при начале выполнения. Доступность внешних аккаунтов не проверяется." : "Versions are pinned when execution starts. External account availability is not checked."}</p>
      {state.warnings.length > 0 && <p className={css.notice}>{ru ? "Есть предупреждения по источникам данных." : "There are warnings about data sources."}</p>}
      <Button className={`${css.button} ${css.quiet}`} onPress={() => setRetry(value => value + 1)}>{ru ? "Проверить снова" : "Check again"}</Button></>}
  </div>;
}
