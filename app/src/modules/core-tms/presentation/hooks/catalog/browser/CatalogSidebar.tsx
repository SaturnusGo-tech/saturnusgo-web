import { CodeSquareSlash, Plugin } from "@openai/apps-sdk-ui/components/Icon";
import { IntegrationBrand } from "../../shared/brand/IntegrationBrand";
import type { HooksCopy } from "../../shared/hooks-copy";
import type { IntegrationId } from "../integration-definitions";
import type { CatalogEntry, CatalogFilter, CatalogGroup } from "../model/catalog-model";
import styles from "../catalog.module.css";

export function CatalogSidebar({ entries, group, copy, russian, onSelect, onOpen }: {
  entries: readonly CatalogEntry[]; group: CatalogGroup; filter: CatalogFilter; copy: HooksCopy; russian: boolean;
  onSelect: (group: CatalogGroup, filter: CatalogFilter) => void; onOpen: (id: IntegrationId) => void;
}) {
  const connected = entries.filter(entry => entry.status === "connected");
  const hasApi = entries.some(entry => entry.integration.group === "api");
  return <aside className={styles.sidebar} aria-label={russian ? "Каталог интеграций" : "Integration catalog"}>
    <header className={styles.sidebarHeader}><h2 className={styles.sidebarTitle}>{russian ? "Настроить Falcon" : "Customize"}</h2></header>
    <nav className={styles.sidebarNav} aria-label={russian ? "Разделы каталога" : "Catalog sections"}>
      <button type="button" aria-pressed={group !== "api"} onClick={() => onSelect("all", "all")}>
        <Plugin width={18} height={18} aria-hidden="true" />{copy.integrations}
      </button>
      {hasApi && <button type="button" aria-pressed={group === "api"} onClick={() => onSelect("api", "all")}>
        <CodeSquareSlash width={18} height={18} aria-hidden="true" />{copy.groups.api}
      </button>}
    </nav>
    <div className={styles.connected}>
      <p className={styles.navLabel}>{russian ? "Подключённые сервисы" : "Connected services"}</p>
      {connected.length ? connected.map(({ integration }) => <button type="button" key={integration.id} onClick={() => onOpen(integration.id)}>
        <span className={styles.smallLogo} aria-hidden="true"><IntegrationBrand provider={integration.id} /></span>
        <span>{integration.name}</span>
      </button>) : <p className={styles.sidebarEmpty}>{russian ? "Пока нет подключений" : "No connections yet"}</p>}
    </div>
  </aside>;
}
