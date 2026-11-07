import { Link2, RefreshCw } from "lucide-react";
import type { CodexEmployee } from "../../domain/model/codex-employee";
import type { useCompanyCodexAdmin } from "../../application/admin/useCompanyCodexAdmin";
import type { CodexConnectionFilter } from "../../domain/admin/company-codex-admin";
import { administrationError } from "../../../company-administration/presentation/copy/administration-errors";
import { CodexMark } from "../branding/CodexMark";
import { CompanyCodexConnectionRow } from "./connections/CompanyCodexConnectionRow";
import css from "./company-codex-admin.module.css";

export function CompanyCodexAdmin({ employee, state, ru, refresh }: {
  employee: CodexEmployee;
  state: ReturnType<typeof useCompanyCodexAdmin>;
  ru: boolean;
  refresh: () => void;
}) {
  const { list, action, pending, error } = state;
  const active = employee.status === "active";
  const status = {
    active: ru ? "Активен" : "Active",
    inactive: ru ? "Отключён" : "Inactive",
    not_activated: ru ? "Не активирован" : "Not activated",
  }[employee.status];
  const filterLabels: Record<CodexConnectionFilter, string> = {
    all: ru ? "Все" : "All",
    active: ru ? "Активные" : "Active",
    revoked: ru ? "Отозванные" : "Revoked",
    expired: ru ? "Истёкшие" : "Expired",
  };
  const failure = (code: string) => code === "PRECONDITION_FAILED"
    ? (ru ? "Настройки изменились. Обновите данные и проверьте действие ещё раз." : "Settings changed. Refresh and review the action again.")
    : administrationError(code, ru ? "ru" : "en");
  const activateLabel = ru ? "Активировать Codex" : "Activate Codex";
  const deactivateLabel = ru ? "Отключить Codex" : "Deactivate Codex";
  const confirmation = action && <div className={css.confirmation} role="group" aria-label={ru ? "Подтверждение действия" : "Confirm action"}>
    <div>
      <p>{action.kind === "revoke"
        ? (ru ? `Отозвать доступ для ${action.name}?` : `Revoke this connection for ${action.name}?`)
        : action.kind === "deactivate"
          ? (ru ? "Отключить Codex для всей компании? Текущие подключения потеряют доступ." : "Deactivate Codex for the company? Current connections will lose access.")
          : (ru ? "Активировать агента Codex для компании? Он займёт одно место." : "Activate the company Codex agent? It will use one seat.")}</p>
      {error && <p className={css.error} role="alert">{failure(error)}</p>}
    </div>
    <div className={css.controls}>
      <button type="button" className={css.secondary} disabled={pending} onClick={() => state.choose(null)}>{ru ? "Отмена" : "Cancel"}</button>
      <button type="button" className={action.kind === "activate" ? css.primary : css.destructive} disabled={pending} onClick={() => void state.confirm()}>
        {pending ? (ru ? "Сохраняем…" : "Saving…") : (ru ? "Подтвердить" : "Confirm")}
      </button>
    </div>
  </div>;

  return <article className={css.page}>
    <header className={css.header}>
      <div>
        <h1>Codex</h1>
        <p>{ru ? "Управляйте агентом Codex и подключениями сотрудников." : "Manage the Codex agent and employee connections."}</p>
      </div>
      <button type="button" className={css.secondary} aria-label={ru ? "Обновить Codex" : "Refresh Codex"} disabled={pending || list.loading || list.pending} onClick={refresh}>
        <RefreshCw size={14} aria-hidden="true" />
        {ru ? "Обновить" : "Refresh"}
      </button>
    </header>

    <section aria-labelledby="codex-access-title">
      <h2 className={css.sectionTitle} id="codex-access-title">{ru ? "Доступ в компании" : "Company access"}</h2>
      <div className={css.settingRow}>
        <div className={css.agentIdentity}>
          <CodexMark className={css.mark} />
          <div className={css.settingCopy}>
            <h3>{ru ? "Агент Codex" : "Codex agent"}</h3>
            <p>{ru ? "Доступ Codex к проектам Falcon." : "Codex access to Falcon projects."}</p>
          </div>
        </div>
        <div className={css.controls}>
          <span className={css.status} data-status={employee.status}>{status}</span>
          {active ? employee.canDeactivate && <button type="button" className={css.secondary} disabled={pending} onClick={() => state.choose({ kind: "deactivate" })}>{deactivateLabel}</button>
            : <button type="button" className={css.primary} disabled={pending || !employee.canActivate} onClick={() => state.choose({ kind: "activate" })}>{activateLabel}</button>}
        </div>
      </div>
      {action && action.kind !== "revoke" && confirmation}
      <div className={css.settingRow}>
        <div className={css.settingCopy}>
          <h3>{ru ? "Места в компании" : "Company seats"}</h3>
          <p>{ru ? "Активный агент Codex занимает одно место." : "An active Codex agent uses one seat."}</p>
        </div>
        <span className={css.seats}>{ru ? `Занято ${employee.capacity.occupied} из ${employee.capacity.limit}` : `${employee.capacity.occupied} of ${employee.capacity.limit} used`}</span>
      </div>
    </section>
    {state.saved && <p className={css.saved} role="status">{ru ? "Доступ обновлён." : "Access updated."}</p>}

    <section className={css.connections} aria-labelledby="codex-connections-title">
      <div className={css.sectionHeader}>
        <h2 className={css.sectionTitle} id="codex-connections-title">{ru ? "Подключения" : "Connections"}</h2>
        <div className={css.filters} role="group" aria-label={ru ? "Статус подключения" : "Connection status"}>
          {(Object.keys(filterLabels) as CodexConnectionFilter[]).map(filter => <button key={filter} type="button" aria-pressed={state.filter === filter} disabled={pending} onClick={() => {
            if (filter === state.filter) return;
            if (action?.kind === "revoke") state.choose(null);
            state.setFilter(filter);
          }}>{filterLabels[filter]}</button>)}
        </div>
      </div>
      {action?.kind === "revoke" && !list.items.some(connection => connection.id === action.id) && confirmation}
      {list.loading ? <div className={css.loading} role="status" aria-label={ru ? "Загружаем подключения" : "Loading connections"}>
        <span /><span />
      </div> : <>
        {list.error && <div className={css.failure} role="alert">
          <p>{failure(list.error)}</p>
          <button type="button" className={css.secondary} disabled={list.pending} onClick={list.refresh}>{ru ? "Повторить" : "Try again"}</button>
        </div>}
        {!list.error && !list.items.length && <div className={css.empty}>
          <span className={css.emptyIcon}><Link2 size={18} aria-hidden="true" /></span>
          <div className={css.settingCopy}>
            <h3>{ru ? "Нет подключений" : "No connections"}</h3>
            <p>{state.filter === "all"
              ? (ru ? "Подключения появятся, когда сотрудники войдут через Codex." : "Connections appear when employees sign in through Codex.")
              : (ru ? "Подключений с таким статусом пока нет." : "No connections match this status.")}</p>
          </div>
        </div>}
        {list.items.length > 0 && <ul className={css.connectionList} role="list">
          {list.items.map(connection => <CompanyCodexConnectionRow key={connection.id} connection={connection} ru={ru} disabled={pending}
            onRevoke={() => state.choose({ kind: "revoke", id: connection.id, name: connection.person.name })}
            confirmation={action?.kind === "revoke" && action.id === connection.id ? confirmation : null} />)}
        </ul>}
        {list.cursor && <button type="button" className={`${css.secondary} ${css.more}`} disabled={list.pending || pending} onClick={() => void list.more()}>
          {list.pending ? (ru ? "Загружаем…" : "Loading…") : (ru ? "Показать ещё" : "Load more")}
        </button>}
      </>}
    </section>
  </article>;
}
