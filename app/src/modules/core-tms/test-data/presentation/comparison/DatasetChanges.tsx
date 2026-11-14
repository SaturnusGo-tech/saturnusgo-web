import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { useTestData } from "../../application/context/TestDataContext";
import type { Dataset, DatasetVersion } from "../../model/resources/resource";
import { formatDataValue } from "../../application/editor/field-input";
import { DataFeedback } from "../shared/DataFeedback";
import css from "../shared/data.module.css";
export function DatasetChanges({ dataset, pinnedId, ru, onChooseLatest, disabled }: { dataset: Dataset; pinnedId: string; ru: boolean; onChooseLatest(): void; disabled?: boolean }) {
  const feature = useTestData(), [expanded, setExpanded] = useState(false), [versions, setVersions] = useState<readonly DatasetVersion[] | null>(null);
  const [error, setError] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!expanded || !feature) return;
    const controller = new AbortController(); setVersions(null); setError(false);
    void Promise.all([feature.port.version(dataset.id, pinnedId, controller.signal), feature.port.version(dataset.id, dataset.currentVersionId, controller.signal)])
      .then(value => { if (!controller.signal.aborted) setVersions(value); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [expanded, feature, dataset.id, dataset.currentVersionId, pinnedId, retry]);
  if (pinnedId === dataset.currentVersionId) return null;
  const keys = Array.from(new Set(versions?.flatMap(version => version.fields.map(field => field.key)) ?? []));
  return <section><p className={css.notice}>{ru ? "Доступна новая версия набора. Текущая привязка не изменена." : "New dataset version available. Your existing binding is unchanged."}</p>
    <Button type="button" className={`${css.button} ${css.quiet}`} aria-expanded={expanded} onPress={() => setExpanded(value => !value)}>{ru ? "Сравнить версии" : "View changes"}</Button>
    {expanded && <><DataFeedback loading={!versions && !error} error={error} ru={ru} retry={() => setRetry(value => value + 1)} />
      {versions && <div className={css.scroll}><table className={css.table}><thead><tr><th>{ru ? "Поле" : "Field"}</th><th>{`v${versions[0].version}`}</th><th>{`v${versions[1].version}`}</th></tr></thead><tbody>{keys.map(key => {
        const before = versions[0].fields.find(field => field.key === key), after = versions[1].fields.find(field => field.key === key);
        return <tr key={key}><td>{key}</td><td className={css.code}>{before ? `${before.type}: ${formatDataValue(before.value)}` : "—"}</td><td className={css.code}>{after ? `${after.type}: ${formatDataValue(after.value)}` : "—"}</td></tr>;
      })}</tbody></table></div>}
      <Button type="button" isDisabled={disabled} className={css.button} onPress={onChooseLatest}>{ru ? "Выбрать новую версию" : "Use latest version"}</Button></>}
  </section>;
}
