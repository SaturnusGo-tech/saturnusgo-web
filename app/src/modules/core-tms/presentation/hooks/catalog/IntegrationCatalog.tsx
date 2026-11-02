import { useState } from "react";
import { ArrowRotateCw, Search, X } from "@openai/apps-sdk-ui/components/Icon";
import type { Provider } from "../../../connectors/model/connector-types";
import { isProvider } from "../../../connectors/model/connector-types";
import type { HooksCopy } from "../shared/hooks-copy";
import type { IntegrationId } from "./integration-definitions";
import { catalogEntries, filterCatalog, type CatalogFilter, type CatalogGroup, type CatalogSource } from "./model/catalog-model";
import { CatalogSidebar } from "./browser/CatalogSidebar";
import { CatalogRows } from "./browser/CatalogRows";
import { CatalogActions } from "./toolbar/CatalogActions";
import styles from "./catalog.module.css";

export function IntegrationCatalog(props: CatalogSource & {
  russian: boolean; copy: HooksCopy; onRefresh: () => void; onOpenYouTrack: () => void;
  onOpenCodex: () => void; onOpenConnector: (provider: Provider) => void;
}) {
  const { russian, copy, statusFailed, connectorState, codexCompanyStatus } = props;
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<CatalogGroup>("all");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const entries = catalogEntries(props);
  const visible = filterCatalog(entries, group, filter, query);
  const select = (value: CatalogGroup, state: CatalogFilter) => { setGroup(value); setFilter(state); };
  const open = (id: IntegrationId) => {
    if (id === "codex") props.onOpenCodex();
    else if (id === "youtrack") props.onOpenYouTrack();
    else if (isProvider(id)) props.onOpenConnector(id);
  };
  return <section className={styles.catalog} aria-label={copy.integrations}>
    <CatalogSidebar entries={entries} group={group} filter={filter} copy={copy} russian={russian} onSelect={select} onOpen={open} />
    <div className={styles.main}>
      <header className={styles.header}>
        <h1>{group === "api" ? copy.groups.api : copy.integrations}</h1>
        <div className={styles.headerActions}>
          <div className={styles.search} data-input-shell><Search width={18} height={18} aria-hidden="true" />
            <input type="search" value={query} aria-label={russian ? "Найти интеграцию" : "Find an integration"}
              placeholder={russian ? "Найти интеграцию" : "Search integrations"} onChange={event => setQuery(event.target.value)} />
            {query && <button type="button" onClick={() => setQuery("")} aria-label={russian ? "Очистить поиск" : "Clear search"}><X width={16} height={16} /></button>}
          </div>
          <button type="button" className={styles.iconButton} onClick={props.onRefresh} aria-label={copy.refresh} title={copy.refresh}><ArrowRotateCw width={18} height={18} /></button>
          <CatalogActions entries={entries} group={group} filter={filter} copy={copy} russian={russian} onSelect={select}
            onReset={() => { setQuery(""); select("all", "all"); }} onOpen={open} />
        </div>
        <p className={styles.subtitle}>{russian ? "Подключите инструменты команды к Falcon." : "Connect your team’s tools to Falcon."}</p>
      </header>
      <nav className={styles.filters} aria-label={russian ? "Статус подключения" : "Connection status"}>
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>{russian ? "Все сервисы" : "All services"}</button>
        <button type="button" aria-pressed={filter === "connected"} onClick={() => setFilter("connected")}>{russian ? "Подключённые" : "Connected"}</button>
      </nav>
      {(statusFailed || connectorState === "error") && <p className={styles.warning} role="status">{russian
        ? "Часть статусов недоступна. Обновите список или откройте сервис для проверки подключения."
        : "Some statuses are unavailable. Refresh the list or open a service to check its connection."}</p>}
      <span className={styles.srOnly} role="status">{russian ? "Сервисов" : "Services"}: {visible.length}</span>
      {visible.length ? <CatalogRows entries={visible} copy={copy} russian={russian} companyStatus={codexCompanyStatus} onOpen={open} onGroup={value => setGroup(value)} />
        : <div className={styles.empty}><Search width={28} height={28} /><h2>{russian ? "Здесь пока нет сервисов" : "No services here"}</h2>
          <p>{russian ? "Измените запрос или фильтры, чтобы найти нужное подключение." : "Change your search or filters to find a connection."}</p>
          <button type="button" onClick={() => { setQuery(""); select("all", "all"); }}>{russian ? "Сбросить фильтры" : "Reset filters"}</button></div>}
    </div>
  </section>;
}
