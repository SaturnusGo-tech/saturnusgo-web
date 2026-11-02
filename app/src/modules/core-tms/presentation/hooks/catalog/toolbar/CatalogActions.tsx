import { Check, ChevronDown, Settings } from "@openai/apps-sdk-ui/components/Icon";
import { IntegrationBrand } from "../../shared/brand/IntegrationBrand";
import { IntegrationThemeToggle } from "../../shared/theme/IntegrationThemeToggle";
import { IntegrationGuideLink } from "../../shared/theme/IntegrationGuideLink";
import type { HooksCopy } from "../../shared/hooks-copy";
import { INTEGRATION_GROUPS, type IntegrationId } from "../integration-definitions";
import type { CatalogEntry, CatalogFilter, CatalogGroup } from "../model/catalog-model";
import { CatalogMenu } from "./CatalogMenu";
import styles from "../catalog.module.css";

export function CatalogActions({ entries, group, filter, russian, copy, onSelect, onReset, onOpen }: {
  entries: readonly CatalogEntry[]; group: CatalogGroup; filter: CatalogFilter; russian: boolean; copy: HooksCopy;
  onSelect: (group: CatalogGroup, state: CatalogFilter) => void; onReset: () => void; onOpen: (id: IntegrationId) => void;
}) {
  const statuses: Array<[CatalogFilter, string]> = [["all", russian ? "Все сервисы" : "All services"], ["connected", copy.statuses.connected],
    ["attention", copy.statuses.attention], ["planned", copy.statuses.planned]];
  const actionable = entries.filter(entry => entry.status !== "planned" && entry.status !== "connected");
  const options = russian ? "Параметры каталога" : "Catalog options";
  const connect = russian ? "Подключить" : "Connect";
  return <>
    <CatalogMenu label={options} active={group !== "all" || (filter !== "all" && filter !== "connected")} trigger={<Settings width={20} height={20} aria-hidden="true" />}>
      {close => <>
        <p className={styles.menuHeading}>{russian ? "Категории" : "Categories"}</p>
        <button type="button" className={styles.menuItem} aria-pressed={group === "all"} onClick={() => { onSelect("all", filter); close(); }}>
          {russian ? "Все сервисы" : "All services"}{group === "all" && <Check width={16} height={16} aria-hidden="true" />}</button>
        {INTEGRATION_GROUPS.filter(id => entries.some(entry => entry.integration.group === id)).map(id => <button type="button" className={styles.menuItem}
          key={id} aria-pressed={group === id} onClick={() => { onSelect(id, filter); close(); }}>{copy.groups[id]}{group === id && <Check width={16} height={16} aria-hidden="true" />}</button>)}
        <p className={styles.menuHeading}>{russian ? "Статус подключения" : "Connection status"}</p>
        {statuses.map(([value, label]) => <button type="button" key={value} className={styles.menuItem} aria-pressed={filter === value}
          onClick={() => { onSelect(group, value); close(); }}>{label}{filter === value && <Check width={16} height={16} aria-hidden="true" />}</button>)}
        <button type="button" className={styles.menuItem} onClick={() => { onReset(); close(); }}>{russian ? "Сбросить фильтры" : "Reset filters"}</button>
        <IntegrationGuideLink article="integration-overview" className={styles.menuItem}>{russian ? "Руководство" : "Guide"}</IntegrationGuideLink>
        <div className={styles.menuItem}><span>{russian ? "Оформление" : "Theme"}</span><IntegrationThemeToggle russian={russian} className={styles.iconButton} /></div>
      </>}
    </CatalogMenu>
    <CatalogMenu label={connect} connect disabled={!actionable.length} trigger={<>{connect}<ChevronDown className={styles.chevron} width={16} height={16} aria-hidden="true" /></>}>
      {close => <><p className={styles.menuHeading}>{russian ? "Выберите сервис" : "Choose a service"}</p>
        {actionable.map(({ integration }) => <button type="button" className={styles.menuItem} key={integration.id} onClick={() => { close(); onOpen(integration.id); }}>
          <span className={styles.smallLogo} aria-hidden="true"><IntegrationBrand provider={integration.id} /></span>{integration.name}</button>)}</>}
    </CatalogMenu>
  </>;
}
