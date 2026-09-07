import { IntegrationBrand } from "../shared/brand/IntegrationBrand";
import { useState } from "react";
import { ArrowUpRight, BookOpen, Search, X, RefreshCw } from "lucide-react";
import type { YouTrackIntegrationStatus } from "../../../application/integrations/getYouTrackIntegrationStatus";
import type { YouTrackConfiguration } from "../../../youtrack/model/youtrack-settings";
import { isProvider, type Connection, type Provider } from "../../../connectors/model/connector-types";
import { IntegrationStatusBadge, type IntegrationUiStatus } from "../shared/IntegrationStatusBadge";
import { IntegrationThemeToggle } from "../shared/theme/IntegrationThemeToggle";
import { IntegrationGuideLink } from "../shared/theme/IntegrationGuideLink";
import type { HooksCopy } from "../shared/hooks-copy";
import { INTEGRATIONS, INTEGRATION_GROUPS, type IntegrationDefinition, type IntegrationGroup } from "./integration-definitions";
import styles from "./catalog.module.css";

type Filter = "all" | "connected" | "attention" | "planned";
export function IntegrationCatalog({ russian, copy, configuration, status, statusFailed, onRefresh,
  onOpenYouTrack, connections, connectorState, projectId, onOpenConnector }: {
  russian: boolean; connections: readonly Connection[]; connectorState: "loading" | "ready" | "error";
  projectId: string; onOpenConnector: (provider: Provider) => void; copy: HooksCopy;
  configuration: YouTrackConfiguration | null; status: YouTrackIntegrationStatus | null;
  statusFailed: boolean; onRefresh: () => void; onOpenYouTrack: () => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<IntegrationGroup | "all">("all");
  const [filter, setFilter] = useState<Filter>("all");
  const entries = INTEGRATIONS.map((integration) => ({ integration, status: integration.id === "youtrack"
    ? catalogIntegrationStatus(configuration, status, statusFailed)
    : isProvider(integration.id) ? connectorState === "loading" ? "checking" : connectorState === "error" ? "attention"
      : connections.some((c) => c.provider === integration.id && c.projectId === projectId && c.enabled) ? "connected" : "available" : "planned" }));
  const search = query.trim().toLocaleLowerCase();
  const visible = entries.filter(({ integration, status: state }) => (group === "all" || integration.group === group)
    && (filter === "all" || state === filter)
    && `${integration.name} ${integration.description.ru} ${integration.description.en}`.toLocaleLowerCase().includes(search));
  const filters: Array<[Filter, string]> = [["all", russian ? "Все подключения" : "All connections"],
    ["connected", russian ? "Подключённые" : "Connected"], ["attention", russian ? "Требуют внимания" : "Needs attention"],
    ["planned", russian ? "Скоро" : "Coming soon"]];
  return <section className={styles.catalog} aria-label={copy.integrations}>
    <header className={styles.header}>
      <div className={styles.heading}><span className={styles.eyebrow}>FALCON / {russian ? "ЭКОСИСТЕМА" : "ECOSYSTEM"}</span>
        <h1>{copy.integrations}</h1><p>{russian ? "Тестирование — часть рабочего процесса команды." : "Bring testing into your team’s workflow."}</p></div>
      <div className={styles.headerActions}>
        <IntegrationGuideLink article="integration-overview"><BookOpen size={15} />{russian ? "Руководство" : "Guide"}</IntegrationGuideLink>
        <IntegrationThemeToggle russian={russian} className={styles.iconButton} />
      </div>
    </header>
    <nav className={styles.categories} aria-label={russian ? "Категории интеграций" : "Integration categories"}>
      <button type="button" aria-pressed={group === "all"} onClick={() => setGroup("all")}>{russian ? "Все сервисы" : "All services"}<span>{entries.length}</span></button>
      {INTEGRATION_GROUPS.map((id) => <button type="button" key={id} aria-pressed={group === id} onClick={() => setGroup(id)}>{copy.groups[id]}</button>)}
    </nav>
    <div className={styles.toolbar}>
      <div className={styles.search}><Search size={16} aria-hidden="true" /><input type="search" value={query}
        aria-label={russian ? "Найти интеграцию" : "Find an integration"} placeholder={russian ? "Найти сервис…" : "Find a service…"}
        onChange={(event) => setQuery(event.target.value)} />
        {query && <button type="button" onClick={() => setQuery("")} aria-label={russian ? "Очистить поиск" : "Clear search"}><X size={14} /></button>}</div>
      <select aria-label={russian ? "Статус подключения" : "Connection status"} value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
        {filters.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <button type="button" className={styles.iconButton} onClick={onRefresh} aria-label={copy.refresh} title={copy.refresh}><RefreshCw size={15} /></button>
    </div>
    {(statusFailed || connectorState === "error") && <p className={styles.warning} role="status">{russian
      ? "Часть статусов недоступна. Обновите список или откройте сервис для проверки подключения."
      : "Some statuses are unavailable. Refresh the list or open a service to check its connection."}</p>}
    <div className={styles.resultCount} role="status">{russian ? "Сервисов" : "Services"}: {visible.length}</div>
    {visible.length ? <div className={styles.grid}>
      {visible.map(({ integration, status: state }) => <IntegrationCard key={integration.id} integration={integration}
        russian={russian} copy={copy} status={state as IntegrationUiStatus}
        onOpen={integration.id === "youtrack" ? onOpenYouTrack : isProvider(integration.id) ? () => onOpenConnector(integration.id as Provider) : undefined} />)}
    </div> : <div className={styles.empty}><Search size={24} /><h2>{russian ? "Здесь пока нет сервисов" : "No services here"}</h2>
      <p>{russian ? "Измените запрос или фильтры, чтобы найти нужное подключение." : "Change your search or filters to find a connection."}</p>
      <button type="button" onClick={() => { setQuery(""); setFilter("all"); setGroup("all"); }}>{russian ? "Сбросить фильтры" : "Reset filters"}</button></div>}
    <footer className={styles.footer}>{russian ? "Связывайте дефекты, запускайте проверки и делитесь результатами в привычных инструментах."
      : "Link defects, trigger test runs and share results in the tools your team already uses."}</footer>
  </section>;
}

function IntegrationCard({ integration, russian, status, onOpen, copy }: {
  integration: IntegrationDefinition; russian: boolean; status: IntegrationUiStatus; onOpen?: () => void; copy: HooksCopy;
}) {
  const content = <>
    <span className={styles.cardTop}><span className={styles.logo} data-provider={integration.id} aria-hidden="true">
      <IntegrationBrand provider={integration.id} />
    </span><span className={styles.category}>{copy.groups[integration.group]}</span></span>
    <strong className={styles.name}>{integration.name}</strong>
    <span className={styles.description}>{russian ? integration.description.ru : integration.description.en}</span>
    <span className={styles.cardFoot}><IntegrationStatusBadge status={status} copy={copy} />
      {onOpen && <span className={styles.openLabel}>{russian ? status === "connected" ? "Управлять" : "Настроить" : status === "connected" ? "Manage" : "Set up"}<ArrowUpRight size={15} /></span>}
    </span>
  </>;
  return onOpen ? <button type="button" className={styles.card} onClick={onOpen}>{content}</button>
    : <div className={styles.card} data-planned="true" aria-disabled="true">{content}</div>;
}
function catalogIntegrationStatus(configuration: YouTrackConfiguration | null, status: YouTrackIntegrationStatus | null, failed: boolean): IntegrationUiStatus {
  if (configuration) {
    if (configuration.source === "runtime" && configuration.enabled && configuration.tokenConfigured) return "connected";
    if (!configuration.enabled || configuration.connection.status === "unconfigured") return "available";
    return configuration.connection.status === "connected" ? "connected" : "attention";
  }
  return status ? "connected" : failed ? "attention" : "checking";
}
