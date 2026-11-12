import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { useState } from "react";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import type { Catalog } from "../../../connectors/model/connector-types";
import type { ImpactPermissions, ImpactScope } from "../../model/impact-types";
import { useImpactRepositories } from "../../application/repositories/useImpactRepositories";
import { RepositoryForm } from "../repository-form/RepositoryForm";
import css from "../styles/impact.module.css";
export function RepositorySettings({ scope, connectionId, catalog, ru, permissions }: {
  scope: ImpactScope; connectionId: string | null; catalog: Catalog; ru: boolean; permissions: ImpactPermissions;
}) {
  const state = useImpactRepositories(scope, ru, permissions.configure); const [editing, setEditing] = useState<string | null>(null);
  const selected = state.rows.find((row) => row.id === editing);
  return <section className={css.panel}>
    <header className={css.heading}><div><h2>{ru ? "Репозитории и области" : "Repositories and areas"}</h2><p>{ru ? "Каждый репозиторий проверяется через сохранённое подключение GitHub. Укажите точный owner/repository и окружение." : "Each repository is verified using the saved GitHub connection. Specify an exact owner/repository and environment."}</p></div>
      <div className={css.actions}><IntegrationButton type="button" isDisabled={state.pending} onPress={() => void state.refresh()}>{ru ? "Обновить" : "Refresh"}</IntegrationButton>
        {permissions.configure && connectionId && <IntegrationButton type="button" isDisabled={state.pending || !state.loaded || Boolean(editing)} onPress={() => setEditing(crypto.randomUUID())}>{ru ? "Добавить репозиторий" : "Add repository"}</IntegrationButton>}</div></header>
    {!connectionId && <p className={css.notice}>{ru ? "Сначала сохраните подключение GitHub на вкладке «Подключение»." : "Save a GitHub connection in the Connection tab first."}</p>}
    <ErrorToast message={state.error} />
    {state.pending && <p role="status">{ru ? "Проверяем и сохраняем…" : "Loading or verifying repository…"}</p>}
    <ul className={css.list}>{state.rows.map((row) => <li className={css.row} key={row.id}>
      <div className={css.rowHeading}><strong>{row.repository}</strong><span className={css.badge}>{row.enabled ? (ru ? "Включён" : "Enabled") : (ru ? "Приостановлен" : "Paused")}</span></div>
      <div className={css.meta}><span>{row.platform}</span><span>{catalog.environments.find((env) => env.id === row.environmentId)?.name ?? row.environmentId}</span><span>{row.branches.join(", ")}</span></div>
      {permissions.configure && <IntegrationButton type="button" isDisabled={state.pending || Boolean(editing)} onPress={() => setEditing(row.id)}>{ru ? "Настроить" : "Configure"}</IntegrationButton>}</li>)}</ul>
    {state.loaded && !state.rows.length && !editing && <p className={css.empty}>{ru ? "Для Impact Analysis ещё не настроены репозитории." : "No repositories configured for Impact Analysis yet."}</p>}
    {editing && connectionId && permissions.configure && <RepositoryForm key={`${editing}:${selected?.rowVersion ?? 0}`} row={selected} connectionId={connectionId}
      catalog={catalog} ru={ru} pending={state.pending} onCancel={() => setEditing(null)} onSave={async (input) => {
        if (await state.save(editing, selected?.rowVersion ?? 0, input)) setEditing(null);
      }} />}
  </section>;
}
