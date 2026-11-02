import { Plugin, Check, ChevronRight } from "@openai/apps-sdk-ui/components/Icon";
import { IntegrationBrand } from "../../shared/brand/IntegrationBrand";
import type { HooksCopy } from "../../shared/hooks-copy";
import { INTEGRATION_GROUPS, type IntegrationId } from "../integration-definitions";
import type { CatalogEntry, CatalogFilter, CatalogGroup } from "../model/catalog-model";
import styles from "../catalog.module.css";

export function CatalogSidebar({ entries, group, filter, copy, russian, onSelect, onOpen }: {
  entries: readonly CatalogEntry[]; group: CatalogGroup; filter: CatalogFilter; copy: HooksCopy; russian: boolean;
  onSelect: (group: CatalogGroup, filter: CatalogFilter) => void; onOpen: (id: IntegrationId) => void;
}) {
  const connected = entries.filter(entry => entry.status === "connected");
  return <aside className={styles.sidebar} aria-label={russian ? "Каталог интеграций" : "Integration catalog"}>
    <h2>{copy.integrations}</h2>
    <nav className={styles.sidebarNav} aria-label={russian ? "Категории интеграций" : "Integration categories"}>
      <button type="button" aria-pressed={group === "all" && filter === "all"} onClick={() => onSelect("all", "all")}>
        <Plugin width={18} height={18} aria-hidden="true" />{russian ? "Все сервисы" : "All services"}
      </button>
      <button type="button" aria-pressed={group === "all" && filter === "connected"} onClick={() => onSelect("all", "connected")}>
        <Check width={18} height={18} aria-hidden="true" />{russian ? "Подключённые" : "Connected"}
        <span className={styles.count}>{connected.length}</span>
      </button>
      <p className={styles.navLabel}>{russian ? "Категории" : "Categories"}</p>
      {INTEGRATION_GROUPS.filter(id => entries.some(entry => entry.integration.group === id)).map(id =>
        <button type="button" key={id} aria-pressed={group === id} onClick={() => onSelect(id, "all")}>{copy.groups[id]}<ChevronRight width={14} height={14} aria-hidden="true" /></button>)}
    </nav>
    <div className={styles.connected}>
      <p className={styles.navLabel}>{russian ? "Подключённые сервисы" : "Connected services"}</p>
      {connected.length ? connected.map(({ integration }) => <button type="button" key={integration.id} onClick={() => onOpen(integration.id)}>
        <span className={styles.smallLogo} aria-hidden="true"><IntegrationBrand provider={integration.id} /></span>
        <span>{integration.name}</span>
      </button>) : <p className={styles.sidebarEmpty}>{russian ? "Подключённые сервисы появятся здесь." : "Your connected services will appear here."}</p>}
    </div>
  </aside>;
}
