import { Button, SelectItem } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { useTestData } from "../../../application/context/TestDataContext";
import { useDataCatalog } from "../../../application/catalog/useDataCatalog";
import { formatDataValue } from "../../../application/editor/field-input";
import type { Dataset, DatasetVersion } from "../../../model/resources/resource";
import { DataSelect } from "../../select/DataSelect";
import { DataFeedback } from "../../shared/DataFeedback";
import shared from "../../shared/data.module.css";
import css from "../styles/resource-reader.module.css";

export function DatasetReader({ dataset, ru }: { dataset: Dataset; ru: boolean }) {
  const feature = useTestData(), [selected, setSelected] = useState(dataset.currentVersionId);
  const [loaded, setLoaded] = useState<DatasetVersion | null>(null), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  const load = useCallback((_search: string, cursor: string | null, signal: AbortSignal) => feature!.port.versions(dataset.id, cursor, signal), [feature, dataset.id]);
  const catalog = useDataCatalog(feature ? load : null);
  useEffect(() => { setSelected(dataset.currentVersionId); }, [dataset.id, dataset.currentVersionId]);
  useEffect(() => {
    const controller = new AbortController(); setLoaded(null); setError(false);
    if (feature && selected) void feature.port.version(dataset.id, selected, controller.signal)
      .then(version => { if (!controller.signal.aborted) setLoaded(version); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [feature, dataset.id, selected, retry]);
  const version = loaded?.id === selected ? loaded : null;
  const choices = version && !catalog.items.some(item => item.id === version.id) ? [version, ...catalog.items] : catalog.items;
  const environment = feature?.environments.find(item => item.id === version?.environmentId)?.name;
  return <section className={css.dataset} aria-label={ru ? "Поля набора" : "Dataset fields"}>
    <div className={css.versionBar}>
      <div className={css.versionSelect}><DataSelect label={ru ? "Версия" : "Version"} selectedKeys={[selected]} isLoading={catalog.loading}
        onSelectionChange={keys => { const value = String([...keys][0] ?? ""); if (value) setSelected(value); }}>
        {choices.map(item => <SelectItem key={item.id}>{`${ru ? "Версия" : "Version"} ${item.version}${item.id === dataset.currentVersionId ? (ru ? " · актуальная" : " · latest") : ""}`}</SelectItem>)}
      </DataSelect></div>
      {version?.environmentId && <span className={css.environment}>{environment ?? (ru ? "Окружение недоступно" : "Environment unavailable")}</span>}
    </div>
    <DataFeedback error={catalog.error} ru={ru} retry={catalog.refresh} />
    {catalog.cursor && <Button className={`${shared.button} ${shared.quiet}`} isLoading={catalog.pending} onPress={() => void catalog.more()}>{ru ? "Другие версии" : "More versions"}</Button>}
    <DataFeedback loading={!version && !error} error={error} ru={ru} retry={() => setRetry(value => value + 1)} />
    {version && <div className={css.tableScroll}><table className={css.table}><thead><tr><th>{ru ? "Поле" : "Field"}</th><th>{ru ? "Тип" : "Type"}</th><th>{ru ? "Значение" : "Value"}</th></tr></thead>
      <tbody>{version.fields.map(field => <tr key={field.key}><td>{field.key}</td><td className={css.type}>{field.type}</td><td className={css.value}>{field.isSecret ? "••••••••" : formatDataValue(field.value)}</td></tr>)}</tbody></table>
      {!version.fields.length && <p className={css.muted}>{ru ? "В этой версии нет полей." : "No fields in this version."}</p>}</div>}
    <p className={css.muted}>{ru ? "Каждая версия неизменяема. Привязки и история сохраняют выбранную версию." : "Versions are immutable. Bindings and history retain their selected version."}</p>
  </section>;
}
