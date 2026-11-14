import { Button } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useTestData } from "../../application/context/TestDataContext";
import type { DataManifest, ExecutionScope, SecretTarget } from "../../model/execution/manifest";
import { formatDataValue } from "../../application/editor/field-input";
import { SecretRevealDialog } from "../reveal/SecretRevealDialog";
import { DataFeedback } from "../shared/DataFeedback";
import { DataReadiness } from "./DataReadiness";
import css from "../shared/data.module.css";
type Result = { readonly owner: object; readonly manifest: DataManifest | null; readonly loading: boolean; readonly error: boolean };
export function ExecutionDataPanel({ scope, refreshVersion, configured, ru }: { scope: ExecutionScope; refreshVersion: string; configured: boolean; ru: boolean }) {
  const feature = useTestData(), [result, setResult] = useState<Result | null>(null), [retry, setRetry] = useState(0);
  const [reveal, setReveal] = useState<{ readonly owner: object; readonly target: SecretTarget } | null>(null);
  const signature = JSON.stringify(scope);
  const owner = useMemo(() => ({}), [feature, feature?.actorId, feature?.projectId, signature, refreshVersion, configured, retry]);
  const active = result?.owner === owner ? result : null;
  const manifest = active?.manifest ?? null, loading = active?.loading ?? configured, error = active?.error ?? false;
  useEffect(() => {
    const controller = new AbortController(); setReveal(null);
    setResult({ owner, manifest: null, loading: Boolean(feature && configured), error: false });
    if (!feature || !configured) return;
    void feature.port.manifest(scope, controller.signal).then(manifest => { if (!controller.signal.aborted) setResult({ owner, manifest, loading: false, error: false }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ owner, manifest: null, loading: false, error: true }); });
    return () => controller.abort();
  }, [owner]);
  if (!feature || !configured) return null;
  return <section className={css.section} aria-label={ru ? "Тестовые данные прогона" : "Execution test data"}>
    <header className={css.heading}><h2>{manifest ? (ru ? "Использованные тестовые данные" : "Test Data Used") : (ru ? "Тестовые данные" : "Test Data")}</h2></header>
    <DataFeedback loading={loading} error={error} ru={ru} retry={() => setRetry(value => value + 1)} />
    {!manifest && !loading && !error && <DataReadiness runId={scope.runId} itemId={scope.itemId} ru={ru} refreshVersion={refreshVersion} />}
    {manifest && <><p className={css.muted}>{ru ? "Зафиксировано для этой попытки. Секретные значения остаются защищёнными." : "Pinned to this attempt. Secret values remain protected."}</p>
      <p className={css.meta}>{ru ? "Подготовлено" : "Prepared"} <time dateTime={manifest.preparedAt}>{new Date(manifest.preparedAt).toLocaleString(ru ? "ru" : "en")}</time></p>
      <ul className={css.rows}>{manifest.sources.map(source => <li key={source.alias} className={css.row} style={{ alignItems: "flex-start" }}>
        <div className={css.rowMain}><span className={css.name}>{source.alias} · {source.name}</span><span className={css.meta}>
          {source.sourceType === "STATIC" ? (ru ? "Статические данные" : "Static data") : source.sourceType === "DATASET" ? (ru ? "Набор данных" : "Shared dataset") : (ru ? "Учётные данные" : "Secure credentials")}</span>
          {source.versionId && <span className={css.meta}>{ru ? "Версия" : "Version"} <code className={css.code} title={source.versionId}>{source.versionId.length > 20 ? `${source.versionId.slice(0, 8)}…${source.versionId.slice(-4)}` : source.versionId}</code></span>}
          {source.fields.map(field => <div key={field.key} className={css.row}>
            <div className={css.rowMain}><code>{`{{${source.alias}.${field.key}}}`}</code><span className={css.meta}>{field.type} · {field.isSecret ? (ru ? "Защищено" : "Protected") : formatDataValue(field.value)}</span></div>
            {field.isSecret && source.sourceType === "CREDENTIAL" && source.sourceId && source.versionId && manifest.environmentId && feature.permissions.reveal
              && <Button className={`${css.button} ${css.quiet}`} onPress={() => setReveal({ owner, target: { resourceId: source.sourceId!, field: field.key,
                secretVersionId: source.versionId!, environmentId: manifest.environmentId!, executionId: manifest.executionId } })}>{ru ? "Показать" : "Reveal"}</Button>}
          </div>)}</div>
      </li>)}</ul></>}
    {reveal?.owner === owner && <SecretRevealDialog key={JSON.stringify(reveal.target)} target={reveal.target} ru={ru} onClose={() => setReveal(null)} />}
  </section>;
}
