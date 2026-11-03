import { ChevronRight, Plus, Search, X } from "@openai/apps-sdk-ui/components/Icon";
import { useState } from "react";
import type { useCodexEmployee } from "../../../codex-employee/application/state/useCodexEmployee";
import { CodexResourceState } from "../../../codex-employee/presentation/shared/CodexResourceState";
import type { CatalogEntry } from "../catalog/model/catalog-model";
import type { IntegrationId } from "../catalog/integration-definitions";
import { IntegrationBrand } from "../shared/brand/IntegrationBrand";
import surface from "../../../codex-employee/presentation/plugin-surface/plugin.module.css";
import css from "./list.module.css";

type Props = { entries: readonly CatalogEntry[]; codex: ReturnType<typeof useCodexEmployee>; ru: boolean; canManage: boolean; pending: boolean; error: string | null;
  onManage: (id: IntegrationId, connect?: boolean) => void; onBrowse: () => void; onToggle: (id: IntegrationId, next: boolean) => void };
export function PluginsList({ entries, codex, ru, canManage, pending, error, onManage, onBrowse, onToggle }: Props) {
  const [query, setQuery] = useState("");
  const visible = entries.filter(({ integration }) => `${integration.name} ${integration.description.ru} ${integration.description.en}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div className={`${surface.surface} ${css.page}`}>
    <header className={css.header}><div><h2 id="settings-plugins-title">{ru ? "Плагины" : "Plugins"}</h2><p>{ru ? "Управляйте интеграциями и подключениями MCP." : "Manage integrations and MCP connections."}</p></div>
      <div className={surface.actions}><button type="button" className={surface.quiet} onClick={onBrowse}>{ru ? "Открыть каталог" : "Browse directory"}</button><button type="button" className={`${surface.primary} ${css.addButton}`} onClick={onBrowse}><Plus width={17} height={17} />{ru ? "Добавить" : "Add"}</button></div></header>
    <div className={css.toolbar}><span>{ru ? "Плагины" : "Plugins"} <small>{entries.length}</small></span><label className={css.search} data-input-shell><Search width={17} height={17} aria-hidden="true" /><input type="search" value={query} aria-label={ru ? "Поиск плагинов" : "Search plugins"} placeholder={ru ? "Поиск плагинов" : "Search plugins"} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label={ru ? "Очистить поиск" : "Clear search"} onClick={() => setQuery("")}><X width={14} height={14} /></button>}</label></div>
    {entries.some(entry => entry.integration.id === "codex") && <CodexResourceState loading={codex.loading} error={codex.error} locale={ru ? "ru" : "en"} retry={codex.refresh} />}
    {error && <p className={css.error} role="alert">{ru ? "Не удалось изменить подключение. Откройте «Управлять», проверьте настройки и повторите." : "Could not update the connection. Open Manage, review the settings and try again."}</p>}
    {visible.length ? <div className={surface.group}>{visible.map(({ integration, status }) => {
      const id = integration.id, active = status === "connected", planned = status === "planned";
      const employee = codex.employee;
      const disabled = pending || status === "checking" || planned || (id === "codex" ? codex.pending || codex.loading || !employee || (active ? !employee.canDeactivate : !employee.canActivate && !employee.canConnect) : !canManage);
      return <div className={surface.row} key={id}>
        <button className={css.open} type="button" onClick={() => onManage(id)} disabled={planned}><span className={`${surface.icon} ${css.brand}`}><IntegrationBrand provider={id} /></span><span className={surface.rowCopy}><strong>{integration.name} <small>Falcon</small></strong><span>{integration.description[ru ? "ru" : "en"]}</span></span></button>
        {planned ? <span className={css.hint}>{ru ? "Скоро" : "Coming soon"}</span> : id === "swagger" ? <span className={css.hint}>{ru ? "API-источники" : "API sources"}</span> : <button type="button" className={surface.switch} role="switch" aria-checked={active} aria-label={id === "codex" ? (ru ? "Агент Codex в компании" : "Company Codex agent") : `${ru ? "Интеграция" : "Integration"} ${integration.name}`} disabled={disabled} onClick={() => onToggle(id, !active)} />}
        {!planned && <button type="button" className={css.chevron} aria-label={`${ru ? "Управлять" : "Manage"} ${integration.name}`} onClick={() => onManage(id)}><ChevronRight width={18} height={18} /></button>}
      </div>;
    })}</div> : <div className={css.empty}><h3>{ru ? "Плагины не найдены" : "No matching plugins"}</h3><p>{ru ? "Измените поисковый запрос." : "Try a different search."}</p></div>}
    <p className={surface.notice}>{ru ? "Доступ к сервисам определяется правами компании и проекта. Для первого подключения откройте «Управлять». Источники Swagger включаются отдельно." : "Company and project permissions control access. Open Manage for first-time setup. Swagger sources are enabled individually."}</p>
  </div>;
}
