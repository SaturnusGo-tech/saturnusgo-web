import { TmsApiError } from "../../../../core/tms/transport/http";
import { useEffect, useRef } from "react";
import type { ApiSource, NamedOption } from "../model/api-source";
import { useApiSourceEditor } from "./useApiSourceEditor";
import { apiSourceError } from "../model/api-source-error";
import { SourceCredentials } from "../forms/SourceCredentials";
import { SourceProjects } from "../forms/SourceProjects";
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
    <header><h1 id="api-source-title">{source ? (ru ? "Настройки API" : "API settings") : (ru ? "Подключить Swagger" : "Connect Swagger")}</h1>
      <p>{ru ? "Добавьте спецификацию и выберите проекты, где API будет доступен." : "Add a specification and choose the projects that can use this API."}</p></header>
    <fieldset disabled={state.pending}>
      <legend className={css.srOnly}>{ru ? "Подключение API" : "API connection"}</legend>
      <label className={css.field}>{ru ? "Название" : "Name"}<input ref={nameInput} maxLength={255} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder={ru ? "Например, API бронирований" : "For example, Booking API"}/></label>
      <label className={css.field}>{ru ? "Ссылка на спецификацию" : "Specification URL"}<input required type="url" maxLength={2048} spellCheck={false} autoComplete="off" value={draft.sourceUrl} onChange={event => setDraft({ ...draft, sourceUrl: event.target.value })} placeholder="https://api.company.com/openapi.json"/><small>{ru ? "OpenAPI или Swagger в формате JSON или YAML." : "OpenAPI or Swagger in JSON or YAML format."}</small></label>
      {duplicate && <div className={css.duplicate}><span>{ru ? "Этот адрес уже подключён:" : "This URL is already connected:"} {duplicate.name}</span><button type="button" onClick={() => onExisting(duplicate)}>{ru ? "Использовать подключение" : "Use existing connection"}</button></div>}
      <SourceCredentials source={source} draft={draft} ru={ru} onChange={setDraft}/>
      <SourceProjects projects={projects} draft={draft} ru={ru} onChange={setDraft}/>
      {source && <section className={css.lifecycle}><label className={css.check}><input type="checkbox" checked={draft.enabled} onChange={event => setDraft({ ...draft, enabled: event.target.checked })}/><span>{ru ? "API включён" : "API enabled"}</span></label>
        <p>{ru ? "Изменения документации и отключение действуют во всех связанных проектах. Чтобы убрать API только из одного проекта, снимите его выбор выше." : "Documentation changes and disabling apply to every linked project. To unlink a single project, deselect it above."}</p></section>}
    </fieldset>
    {Boolean(state.error) && <div className={css.error} role="alert"><p>{apiSourceError(state.error, ru)}</p>
      {state.error instanceof TmsApiError && state.error.status === 412 && <button type="button" onClick={onReload}>{ru ? "Обновить данные" : "Reload data"}</button>}</div>}
    <footer><span role="status">{state.pending ? (ru ? "Проверяем спецификацию…" : "Checking specification…") : ""}</span>
      <button type="button" className={css.cancel} disabled={state.pending} onClick={onClose}>{ru ? "Отмена" : "Cancel"}</button>
      <button type="submit" className={css.save} disabled={state.pending}>{state.pending ? (ru ? "Сохранение…" : "Saving…") : source ? (ru ? "Сохранить изменения" : "Save changes") : (ru ? "Подключить API" : "Connect API")}</button></footer>
  </form>;
}
