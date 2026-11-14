import { Button, SelectItem } from "@heroui/react";
import { DataSelect as Select } from "../select/DataSelect";
import { useCallback, useEffect, useState } from "react";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCatalog } from "../../application/catalog/useDataCatalog";
import type { Dataset, DatasetVersion } from "../../model/resources/resource";
import { formatDataValue } from "../../application/editor/field-input";
import { DataFeedback } from "../shared/DataFeedback";
import css from "../shared/data.module.css";
export function DatasetVersionPicker({ dataset, selected, onChange, ru }: { dataset: Dataset; selected: string; onChange(value: string): void; ru: boolean }) {
  const feature = useTestData(), [showFields, setShowFields] = useState(false);
  const load = useCallback((_search: string, cursor: string | null, signal: AbortSignal) => feature!.port.versions(dataset.id, cursor, signal), [feature, dataset.id]);
  const versions = useDataCatalog(feature ? load : null);
  const [pinned, setPinned] = useState<DatasetVersion | null>(null), [pinError, setPinError] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setPinned(null); setPinError(false);
    if (feature && selected) void feature.port.version(dataset.id, selected, controller.signal)
      .then(value => { if (!controller.signal.aborted) setPinned(value); })
      .catch(() => { if (!controller.signal.aborted) setPinError(true); });
    return () => controller.abort();
  }, [feature, selected, dataset.id]);
  const selectedVersion = versions.items.find(item => item.id === selected) ?? pinned;
  const choices = pinned && !versions.items.some(item => item.id === pinned.id) ? [pinned, ...versions.items] : versions.items;
  return <div className={css.form}>
    <Select disableAnimation label={ru ? "Зафиксированная версия" : "Pinned version"} labelPlacement="outside" selectedKeys={selected ? [selected] : []}
      isLoading={versions.loading} onSelectionChange={keys => { const value = String([...keys][0] ?? ""); if (value) onChange(value); }}
      classNames={{ trigger: css.inputShell, value: css.input }}>
      {choices.map(version => <SelectItem key={version.id}>{`Version ${version.version}${version.id === dataset.currentVersionId ? (ru ? " · актуальная" : " · latest") : ""}`}</SelectItem>)}
    </Select>
    <DataFeedback error={versions.error || pinError} ru={ru} retry={versions.refresh} />
    {versions.cursor && <Button className={`${css.button} ${css.quiet}`} isLoading={versions.pending} onPress={() => void versions.more()}>{ru ? "Другие версии" : "More versions"}</Button>}
    {selectedVersion && <Button type="button" className={`${css.button} ${css.quiet}`} aria-expanded={showFields} onPress={() => setShowFields(value => !value)}>{showFields ? (ru ? "Скрыть поля" : "Hide fields") : (ru ? "Показать поля версии" : "Review version fields")}</Button>}
    {showFields && selectedVersion && <div className={css.scroll}><table className={css.table}><thead><tr><th>{ru ? "Поле" : "Field"}</th><th>{ru ? "Тип" : "Type"}</th><th>{ru ? "Значение" : "Value"}</th></tr></thead>
      <tbody>{selectedVersion.fields.map(field => <tr key={field.key}><td>{field.key}</td><td>{field.type}</td><td className={css.code}>{formatDataValue(field.value)}</td></tr>)}</tbody></table></div>}
    <p className={css.muted}>{ru ? "Новая версия набора не изменит эту привязку автоматически." : "New dataset versions do not change this binding automatically."}</p>
  </div>;
}
