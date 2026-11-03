import { RefreshCw, Link2 } from "lucide-react";
import type { CodexEmployee } from "../../domain/model/codex-employee";
import type { useCompanyCodexAdmin } from "../../application/admin/useCompanyCodexAdmin";
import { administrationError } from "../../../company-administration/presentation/copy/administration-errors";
import { CodexMark } from "../branding/CodexMark";
import { CompanyCodexConnectionRow } from "./connections/CompanyCodexConnectionRow";
import css from "./company-codex-admin.module.css";

export function CompanyCodexAdmin({ employee, state, ru, refresh }: {
  employee: CodexEmployee; state: ReturnType<typeof useCompanyCodexAdmin>; ru: boolean; refresh: () => void;
}) {
  const { list, action, pending, error } = state;
  const status = { active: ru ? "Активен" : "Active", inactive: ru ? "Отключён" : "Inactive", not_activated: ru ? "Не активирован" : "Not activated" }[employee.status];
  const filterLabels = { all: ru ? "Все" : "All", active: ru ? "Активные" : "Active", revoked: ru ? "Отозванные" : "Revoked", expired: ru ? "Истёкшие" : "Expired" };
  const failure = (code: string) => code === "PRECONDITION_FAILED" ? (ru ? "Настройки изменились. Обновите данные и проверьте действие ещё раз." : "Settings changed. Refresh and review the action again.") : administrationError(code, ru ? "ru" : "en");
  return <article className={css.page}>
    <header className={css.header}><CodexMark className={css.mark} /><div><h1>Codex</h1><p>{ru ? "Доступ агента и подключения сотрудников вашей компании." : "Agent access and your company’s connections."}</p></div>
      <button type="button" className={css.iconButton} aria-label={ru ? "Обновить Codex" : "Refresh Codex"} disabled={pending || list.pending} onClick={refresh}><RefreshCw size={17} strokeWidth={1.6} /></button>
    </header>
    <section className={css.lifecycle} aria-label={ru ? "Доступ в компании" : "Company access"}>
      <div className={css.property}><span>{ru ? "Статус" : "Status"}</span><span className={css.status} data-status={employee.status}>{status}</span></div>
      <div className={css.property}><span>{ru ? "Занято мест" : "Occupied seats"}</span><span>{employee.capacity.occupied} / {employee.capacity.limit}</span></div>
      <div className={css.lifecycleActions}><p>{ru ? "Один агент Codex занимает одно место в компании." : "One Codex agent uses one company seat."}</p>
        {employee.status === "active" ? employee.canDeactivate && <button type="button" className={css.danger} disabled={pending} onClick={() => state.choose({ kind: "deactivate" })}>{ru ? "Отключить Codex" : "Deactivate Codex"}</button>
          : <button type="button" className={css.primary} disabled={pending || !employee.canActivate} onClick={() => state.choose({ kind: "activate" })}>{ru ? "Активировать Codex" : "Activate Codex"}</button>}
      </div>
    </section>
    {action && <div className={css.confirmation} role="group" aria-label={ru ? "Подтверждение действия" : "Confirm action"}>
      <p>{action.kind === "revoke" ? (ru ? `Отозвать это подключение ${action.name}?` : `Revoke this connection for ${action.name}?`) : action.kind === "deactivate" ? (ru ? "Отключить Codex для всей компании? Текущие подключения потеряют доступ." : "Deactivate Codex for the company? Current connections will lose access.") : (ru ? "Активировать агента Codex для компании? Он займёт одно место." : "Activate the company Codex agent? It will use one seat.")}</p>
      <div><button type="button" className={action.kind === "activate" ? css.primary : css.danger} disabled={pending} onClick={() => void state.confirm()}>{pending ? (ru ? "Сохраняем…" : "Saving…") : (ru ? "Подтвердить" : "Confirm")}</button><button type="button" className={css.quiet} disabled={pending} onClick={() => state.choose(null)}>{ru ? "Отмена" : "Cancel"}</button></div>
    </div>}
    {error && <p className={css.error} role="alert">{failure(error)}</p>}
    {state.saved && <p className={css.feedback} role="status">{ru ? "Доступ обновлён." : "Access updated."}</p>}
    <section className={css.connections} aria-labelledby="codex-connections-title">
      <div className={css.sectionHeader}><h2 id="codex-connections-title">{ru ? "Подключения" : "Connections"}</h2><div className={css.filters} aria-label={ru ? "Статус подключения" : "Connection status"}>{(Object.keys(filterLabels) as (keyof typeof filterLabels)[]).map(filter => <button key={filter} type="button" aria-pressed={state.filter === filter} disabled={pending} onClick={() => state.setFilter(filter)}>{filterLabels[filter]}</button>)}</div></div>
      {list.loading ? <p className={css.feedback} role="status">{ru ? "Загружаем подключения…" : "Loading connections…"}</p> : <>
        {list.error && <div className={css.failure} role="alert"><p>{failure(list.error)}</p><button type="button" className={css.quiet} disabled={list.pending} onClick={list.refresh}>{ru ? "Повторить" : "Try again"}</button></div>}
        {!list.error && !list.items.length && <div className={css.empty}><Link2 size={28} strokeWidth={1.4} aria-hidden="true" /><h3>{ru ? "Нет подключений" : "No connections"}</h3><p>{state.filter === "all" ? (ru ? "Подключения появятся после авторизации сотрудников в Codex." : "Connections appear after people authenticate in Codex.") : (ru ? "Подключений с таким статусом пока нет." : "No connections match this status.")}</p></div>}
        {list.items.map(connection => <CompanyCodexConnectionRow key={connection.id} connection={connection} ru={ru} disabled={pending} onRevoke={() => state.choose({ kind: "revoke", id: connection.id, name: connection.person.name })} />)}
        {list.cursor && <button type="button" className={css.more} disabled={list.pending || pending} onClick={() => void list.more()}>{list.pending ? (ru ? "Загружаем…" : "Loading…") : (ru ? "Показать ещё" : "Load more")}</button>}
      </>}
    </section>
  </article>;
}
