import { ErrorToast } from "../../presentation/common/error/ErrorToast";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { useEffect, useRef } from "react";
import type { ApiSource, NamedOption } from "../model/api-source";
import { useApiSourceEditor } from "./useApiSourceEditor";
import { apiSourceError } from "../model/api-source-error";
import { SourceCredentials } from "../forms/SourceCredentials";
import { SourceProjects } from "../forms/SourceProjects";
import { ApiSourceIcon } from "../presentation/identity/ApiSourceIcon";
import css from "./editor.module.css";
export function SourceEditor({ workspaceId, projectId, source, catalog, projects, ru, onClose, onSaved, onExisting, onReload, onPendingChange }: {
  workspaceId: string; projectId: string; source: ApiSource | null; catalog: readonly ApiSource[]; projects: readonly NamedOption[];
  ru: boolean; onClose: () => void; onSaved: (source: ApiSource) => void; onExisting: (source: ApiSource) => void; onReload: () => void; onPendingChange?: (pending: boolean) => void;
}) {
  const state = useApiSourceEditor(workspaceId, projectId, source, onSaved), nameInput = useRef<HTMLInputElement>(null);
  const { draft, setDraft } = state;
  useEffect(() => { nameInput.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { onPendingChange?.(state.pending); }, [state.pending, onPendingChange]);
  const duplicate = !source && catalog.find(api => api.sourceUrl.trim() === draft.sourceUrl.trim());
  return <form className={css.panel} aria-labelledby="api-source-title" onSubmit={event => { event.preventDefault(); void state.save(); }}>
    <header><ApiSourceIcon id={source?.id} size={44}/><div><h1 id="api-source-title">{source ? source.name : (ru ? "Подключить API" : "Connect API")}</h1>
      <p>{ru ? "Спецификация OpenAPI или Swagger в формате JSON или YAML." : "An OpenAPI or Swagger specification in JSON or YAML."}</p></div></header>
    <fieldset disabled={state.pending}>
      <legend className={css.srOnly}>{ru ? "Подключение API" : "API connection"}</legend>
      <div className={css.fields}>
      <label className={css.settingField}><span>{ru ? "Название" : "Name"}</span><input ref={nameInput} maxLength={255} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder={ru ? "API бронирований" : "Booking API"}/></label>
      <label className={css.settingField}><span>{ru ? "Спецификация" : "Specification"}</span><input required type="url" maxLength={2048} spellCheck={false} autoComplete="off" value={draft.sourceUrl} onChange={event => setDraft({ ...draft, sourceUrl: event.target.value })} placeholder="https://api.company.com/openapi.json"/></label>
      </div>
      {duplicate && <div className={css.duplicate}><span>{ru ? "Этот адрес уже подключён:" : "This URL is already connected:"} {duplicate.name}</span><button type="button" onClick={() => onExisting(duplicate)}>{ru ? "Использовать подключение" : "Use existing connection"}</button></div>}
      <div className={css.options}>
        <SourceCredentials source={source} draft={draft} ru={ru} onChange={setDraft}/>
        <SourceProjects projects={projects} draft={draft} ru={ru} onChange={setDraft}/>
        {source && <section className={css.lifecycle}><label><span>{ru ? "API включён" : "API enabled"}
          {(draft.allProjects || draft.projectIds.length > 1) && <small>{draft.allProjects
            ? (ru ? "Отключение действует во всех проектах рабочего пространства." : "Disabling affects every project in this workspace.")
            : (ru ? "Отключение действует во всех выбранных проектах." : "Disabling affects all selected projects.")}</small>}
          </span><input type="checkbox" role="switch" checked={draft.enabled} onChange={event => setDraft({ ...draft, enabled: event.target.checked })}/></label></section>}
      </div>
    </fieldset>
    <ErrorToast message={state.error ? apiSourceError(state.error, ru) : null}
      retryLabel={ru ? "Обновить данные" : "Reload data"} onRetry={state.error && state.error instanceof TmsApiError && state.error.status === 412 ? onReload : undefined} />
    <footer><span role="status">{state.pending ? (ru ? "Проверяем спецификацию…" : "Checking specification…") : ""}</span>
      <button type="button" className={css.cancel} disabled={state.pending} onClick={onClose}>{ru ? "Отмена" : "Cancel"}</button>
      <button type="submit" className={css.save} disabled={state.pending}>{state.pending ? (ru ? "Сохранение…" : "Saving…") : source ? (ru ? "Сохранить изменения" : "Save changes") : (ru ? "Подключить API" : "Connect API")}</button></footer>
  </form>;
}
