import { useState } from "react";
import type { Catalog } from "../../../connectors/model/connector-types";
import type { ImpactPermissions, ImpactRepository, ImpactScope, RepositoryInput } from "../../model/impact-types";
import { useImpactRepositories } from "../../application/repositories/useImpactRepositories";
import { MappingEditor } from "../mappings/MappingEditor";
import css from "../styles/impact.module.css";
const lines = (value: string) => value.split("\n");
const normalize = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];
export function RepositorySettings({ scope, connectionId, catalog, ru, permissions }: {
  scope: ImpactScope; connectionId: string | null; catalog: Catalog; ru: boolean; permissions: ImpactPermissions;
}) {
  const state = useImpactRepositories(scope, ru, permissions.configure); const [editing, setEditing] = useState<string | null>(null);
  const selected = state.rows.find((row) => row.id === editing);
  return <section className={css.panel}>
    <header className={css.heading}><div><h2>{ru ? "Репозитории и области" : "Repositories and areas"}</h2><p>{ru ? "Каждый репозиторий проверяется через сохранённое подключение GitHub. Укажите точный owner/repository и окружение." : "Each repository is verified using the saved GitHub connection. Specify an exact owner/repository and environment."}</p></div>
      <div className={css.actions}><button type="button" disabled={state.pending} onClick={() => void state.refresh()}>{ru ? "Обновить" : "Refresh"}</button>
        {permissions.configure && connectionId && <button type="button" disabled={state.pending || !state.loaded || Boolean(editing)} onClick={() => setEditing(crypto.randomUUID())}>{ru ? "Добавить репозиторий" : "Add repository"}</button>}</div></header>
    {!connectionId && <p className={css.notice}>{ru ? "Сначала сохраните подключение GitHub на вкладке «Подключение»." : "Save a GitHub connection in the Connection tab first."}</p>}
    {state.error && <p role="alert" className={css.error}>{state.error}</p>}
    {state.pending && <p role="status">{ru ? "Проверяем и сохраняем…" : "Loading or verifying repository…"}</p>}
    <ul className={css.list}>{state.rows.map((row) => <li className={css.row} key={row.id}>
      <div className={css.rowHeading}><strong>{row.repository}</strong><span className={css.badge}>{row.enabled ? (ru ? "Включён" : "Enabled") : (ru ? "Приостановлен" : "Paused")}</span></div>
      <div className={css.meta}><span>{row.platform}</span><span>{catalog.environments.find((env) => env.id === row.environmentId)?.name ?? row.environmentId}</span><span>{row.branches.join(", ")}</span></div>
      {permissions.configure && <button type="button" disabled={state.pending || Boolean(editing)} onClick={() => setEditing(row.id)}>{ru ? "Настроить" : "Configure"}</button>}</li>)}</ul>
    {state.loaded && !state.rows.length && !editing && <p className={css.empty}>{ru ? "Для Impact Analysis ещё не настроены репозитории." : "No repositories configured for Impact Analysis yet."}</p>}
    {editing && connectionId && permissions.configure && <RepositoryForm key={`${editing}:${selected?.rowVersion ?? 0}`} row={selected} connectionId={connectionId}
      catalog={catalog} ru={ru} pending={state.pending} onCancel={() => setEditing(null)} onSave={async (input) => {
        if (await state.save(editing, selected?.rowVersion ?? 0, input)) setEditing(null);
      }} />}
  </section>;
}
function RepositoryForm({ row, connectionId, catalog, ru, pending, onSave, onCancel }: {
  row?: ImpactRepository; connectionId: string; catalog: Catalog; ru: boolean; pending: boolean;
  onSave: (input: RepositoryInput) => Promise<void>; onCancel: () => void;
}) {
  const [draft, setDraft] = useState<RepositoryInput>(() => row ? {
    connectionId: row.connectionId, repository: row.repository, platform: row.platform, enabled: row.enabled,
    environmentId: row.environmentId, branches: row.branches, workflows: row.workflows, mappings: row.mappings, sensitivePaths: row.sensitivePaths,
  } : { connectionId, repository: "", platform: "backend", enabled: false, environmentId: "", branches: ["main"], workflows: [], mappings: [], sensitivePaths: [] });
  const field = <K extends keyof RepositoryInput>(key: K, value: RepositoryInput[K]) => setDraft((old) => ({ ...old, [key]: value }));
  return <form className={css.row} onSubmit={(event) => { event.preventDefault(); void onSave({ ...draft,
    repository: draft.repository.trim(), branches: normalize(draft.branches), workflows: normalize(draft.workflows), sensitivePaths: normalize(draft.sensitivePaths),
    mappings: draft.mappings.map((mapping) => ({ ...mapping, area: mapping.area.trim(), pathPrefixes: normalize(mapping.pathPrefixes),
      components: normalize(mapping.components), tags: normalize(mapping.tags), folderPrefixes: normalize(mapping.folderPrefixes), endpoints: normalize(mapping.endpoints) })),
  }); }} style={{ marginTop: 16 }}>
    <fieldset disabled={pending}><legend>{row ? (ru ? "Настройки репозитория" : "Repository settings") : (ru ? "Новый репозиторий" : "New repository")}</legend>
      <div className={css.grid}><label className={css.field}>GitHub owner/repository<input required maxLength={255} pattern="[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+" value={draft.repository} onChange={(event) => field("repository", event.target.value)} /></label>
        <label className={css.field}>{ru ? "Платформа" : "Platform"}<select value={draft.platform} onChange={(event) => field("platform", event.target.value as RepositoryInput["platform"])}>
          {["backend", "ios", "android", "api", "web", "shared"].map((platform) => <option key={platform}>{platform}</option>)}</select></label>
        <label className={css.field}>{ru ? "Окружение тест-рана" : "Test run environment"}<select required value={draft.environmentId} onChange={(event) => field("environmentId", event.target.value)}>
          <option value="">{ru ? "Выберите окружение" : "Select environment"}</option>{catalog.environments.map((env) => <option key={env.id} value={env.id}>{env.name}</option>)}</select></label>
        <label className={css.field}>{ru ? "Ветки: по одной на строку" : "Branches: one per line"}<textarea value={draft.branches.join("\n")} onChange={(event) => field("branches", lines(event.target.value))} /></label>
        <label className={css.field}>{ru ? "GitHub Actions workflows: по одному на строку" : "GitHub Actions workflows: one per line"}<textarea value={draft.workflows.join("\n")} onChange={(event) => field("workflows", lines(event.target.value))} /></label>
        <label className={css.field}>{ru ? "Чувствительные пути: по одному префиксу на строку" : "Sensitive paths: one prefix per line"}<textarea value={draft.sensitivePaths.join("\n")} onChange={(event) => field("sensitivePaths", lines(event.target.value))} /></label></div>
      <MappingEditor mappings={draft.mappings} platform={draft.platform} ru={ru} onChange={(value) => field("mappings", value)} />
      <label className={css.check}><input type="checkbox" checked={draft.enabled} onChange={(event) => field("enabled", event.target.checked)} />{ru ? "Включить анализ событий этого репозитория" : "Enable analysis of this repository's events"}</label>
      <div className={css.actions}><button className={css.primary} type="submit">{ru ? "Проверить доступ и сохранить" : "Verify access and save"}</button><button type="button" onClick={onCancel}>{ru ? "Отмена" : "Cancel"}</button></div>
    </fieldset>
  </form>;
}
