import { Button, SelectItem } from "@heroui/react";
import { IntegrationInput as Input } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { IntegrationSwitch as Switch } from "../../../presentation/common/integration-controls/switch/IntegrationSwitch";
import { DataSelect as Select } from "../select/DataSelect";
import { Database, KeyRound, Plus, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCatalog } from "../../application/catalog/useDataCatalog";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { Credential, Dataset } from "../../model/resources/resource";
import { DatasetEditor } from "../dataset/DatasetEditor";
import { CredentialEditor } from "../credential/CredentialEditor";
import { ResourceDetails } from "../resource/ResourceDetails";
import { DataFeedback } from "../shared/DataFeedback";
import css from "../shared/data.module.css";
export function TestDataLibrary({ onOpenCase }: { onOpenCase?(id: string): void }) {
  const feature = useTestData(), { locale } = useTmsLocale(), ru = locale === "ru";
  const [tab, setTab] = useState<"datasets" | "credentials">("datasets");
  const [sort, setSort] = useState<"name" | "updatedAt">("name");
  const [archived, setArchived] = useState(false);
  const load = useCallback((search: string, cursor: string | null, signal: AbortSignal) => tab === "datasets"
    ? feature!.port.datasets(search, cursor, signal, archived, sort) : feature!.port.credentials(search, cursor, signal, sort), [feature, tab, archived, sort]);
  const catalog = useDataCatalog<Dataset | Credential>(feature?.permissions.read ? load : null);
  const [creating, setCreating] = useState(false), [selected, setSelected] = useState<Dataset | Credential | null>(null);
  const canCreate = tab === "datasets" ? feature?.permissions.create : feature?.permissions.credentialCreate;
  return <section className={css.page} aria-label={ru ? "Библиотека тестовых данных" : "Test data library"}>
    <header className={css.pageHeader}><div><h1>{ru ? "Тестовые данные" : "Test Data"}</h1><p className={css.muted}>{ru ? "Общие наборы и защищённые учётные записи вашего проекта." : "Reusable datasets and protected test accounts for your project."}</p></div>
      {canCreate && <Button className={`${css.button} ${css.primary}`} startContent={<Plus size={15} />} onPress={() => setCreating(true)}>{tab === "datasets" ? (ru ? "Создать набор" : "Create dataset") : (ru ? "Создать учётные данные" : "Create credential")}</Button>}</header>
    <div className={css.toolbar}><div className={css.tabs} role="tablist" aria-label={ru ? "Тип данных" : "Resource type"} onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault(); const next = event.key === "Home" ? "datasets" : event.key === "End" ? "credentials" : tab === "datasets" ? "credentials" : "datasets";
      setTab(next); setSelected(null); event.currentTarget.querySelector<HTMLButtonElement>(`[data-library-type="${next}"]`)?.focus();
    }}>
      <Button role="tab" data-library-type="datasets" aria-selected={tab === "datasets"} className={`${css.button} ${css.quiet}`} onPress={() => { setTab("datasets"); setSelected(null); }} startContent={<Database size={15} />}>{ru ? "Наборы данных" : "Datasets"}</Button>
      <Button role="tab" data-library-type="credentials" aria-selected={tab === "credentials"} className={`${css.button} ${css.quiet}`} onPress={() => { setTab("credentials"); setSelected(null); }} startContent={<KeyRound size={15} />}>{ru ? "Учётные данные" : "Credentials"}</Button>
    </div><div className={css.toolbarFilters}>{tab === "datasets" && <Switch className={css.toolbarArchive} size="sm" isSelected={archived} onValueChange={setArchived}>{ru ? "Архив" : "Archived"}</Switch>}<Select disableAnimation className={css.toolbarSort} aria-label={ru ? "Сортировка" : "Sort resources"} selectedKeys={[sort]}
      onSelectionChange={keys => { const next = [...keys][0]; if (next === "name" || next === "updatedAt") setSort(next); }} classNames={{ trigger: css.inputShell, value: css.input }}>
      <SelectItem key="name">{ru ? "По названию" : "Name A–Z"}</SelectItem><SelectItem key="updatedAt">{ru ? "Сначала новые" : "Recently updated"}</SelectItem></Select><Input className={css.toolbarSearch} startContent={<Search size={16} />} aria-label={ru ? "Найти по названию" : "Search by name"}
      placeholder={ru ? "Найти по названию" : "Search by name"} value={catalog.search} onValueChange={catalog.setSearch} classNames={{ inputWrapper: css.inputShell, input: css.input }} /></div></div>
    <DataFeedback loading={catalog.loading} error={catalog.error} denied={!feature?.permissions.read} ru={ru} retry={catalog.refresh} />
    {!catalog.loading && feature?.permissions.read && <div className={css.scroll}><table className={css.table}><thead><tr>
      <th>{ru ? "Название" : "Name"}{sort === "name" ? " ↑" : ""}</th>{tab === "credentials" && <th>{ru ? "Окружение" : "Environment"}</th>}<th>{tab === "datasets" ? (ru ? "Версия" : "Version") : (ru ? "Статус" : "Status")}</th><th>{ru ? "Поля" : "Fields"}</th><th>{ru ? "Связанные кейсы" : "Used in"}</th><th>{ru ? "Обновлено" : "Updated"}</th>
    </tr></thead><tbody>{catalog.items.map(item => <tr key={item.id}>
      <td><Button variant="light" className={`${css.button} ${css.quiet}`} onPress={() => setSelected(item)}>{item.name}</Button></td>
      {tab === "credentials" && <td>{feature.environments.find(environment => environment.id === item.environmentId)?.name ?? (ru ? "Окружение недоступно" : "Environment unavailable")}</td>}
      <td>{"currentVersion" in item ? `v${item.currentVersion}` : item.disabled ? (ru ? "Отключено" : "Disabled") : (ru ? "Настроено" : "Configured")}</td>
      <td>{"fieldCount" in item ? item.fieldCount : item.fields.length}</td><td>{item.usedIn}</td><td>{new Date(item.updatedAt).toLocaleDateString(locale)}</td>
    </tr>)}</tbody></table></div>}
    {!catalog.loading && !catalog.error && feature?.permissions.read && !catalog.items.length && <div className={css.empty} style={{ paddingBlock: 48 }}>
      <p className={css.name}>{catalog.search ? (ru ? "Ничего не найдено" : "No matching resources") : (ru ? "Здесь появятся тестовые данные" : "Your test data will appear here")}</p>
      <p className={css.muted}>{catalog.search ? (ru ? "Попробуйте другое название." : "Try another name.") : (ru ? "Создайте первый ресурс и подключите его к тест-кейсу." : "Create your first resource and link it to a test case.")}</p></div>}
    {catalog.cursor && <div className={css.footer}><Button className={css.button} isLoading={catalog.pending} onPress={() => void catalog.more()}>{ru ? "Показать ещё" : "Load more"}</Button></div>}
    {creating && (tab === "datasets" ? <DatasetEditor ru={ru} onSaved={() => { setCreating(false); catalog.refresh(); }} onClose={() => setCreating(false)} />
      : <CredentialEditor ru={ru} onSaved={() => { setCreating(false); catalog.refresh(); }} onClose={() => setCreating(false)} />)}
    {selected && <ResourceDetails key={selected.id} resource={selected} ru={ru} onClose={() => setSelected(null)} onUpdated={() => { setSelected(null); catalog.refresh(); }} onOpenCase={onOpenCase} />}
  </section>;
}
