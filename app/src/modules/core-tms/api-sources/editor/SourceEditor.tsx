import { TmsApiError } from "../../../../core/tms/transport/http";
import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ApiSource, NamedOption } from "../model/api-source";
import { useApiSourceEditor } from "./useApiSourceEditor";
import { apiSourceError } from "../model/api-source-error";
import { SourceCredentials } from "../forms/SourceCredentials";
import { SourceProjects } from "../forms/SourceProjects";
import css from "./editor.module.css";
export function SourceEditor({ workspaceId, projectId, source, catalog, projects, ru, onClose, onSaved, onExisting, onReload }: {
  workspaceId: string; projectId: string; source: ApiSource | null; catalog: readonly ApiSource[]; projects: readonly NamedOption[];
  ru: boolean; onClose: () => void; onSaved: (source: ApiSource) => void; onExisting: (source: ApiSource) => void; onReload: () => void;
}) {
  const state = useApiSourceEditor(workspaceId, projectId, source, onSaved); const panel = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion(); const { draft, setDraft } = state;
  useEffect(() => {
    const origin = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
    return () => { if (origin?.isConnected) origin.focus({ preventScroll: true }); };
  }, []);
  const duplicate = !source && catalog.find(api => api.sourceUrl.trim() === draft.sourceUrl.trim());
  return <motion.div className={css.scrim} initial={{ backgroundColor: "#0000" }} animate={{ backgroundColor: "#0005" }} exit={{ backgroundColor: "#0000" }}
    transition={{ duration: reduced ? 0 : .24 }} onPointerDown={event => { if (event.target === event.currentTarget && !state.pending) onClose(); }}>
    <motion.div ref={panel} className={css.panel} role="dialog" aria-modal="true" aria-labelledby="api-source-title"
      initial={{ x: reduced ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduced ? 0 : "100%" }} transition={{ duration: reduced ? 0 : .26, ease: [.22,.75,.25,1] }}
      onKeyDown={event => {
        if (event.key === "Escape" && !event.defaultPrevented && !state.pending) { event.preventDefault(); onClose(); }
        if (event.key === "Tab") {
          const items = [...panel.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(node => node.getClientRects().length && !node.closest('[aria-hidden="true"]'));
          const first = items[0], last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <form onSubmit={event => { event.preventDefault(); void state.save(); }}>
        <header><h2 id="api-source-title">{source ? (ru ? "Настройки API" : "API settings") : (ru ? "Подключить API" : "Connect API")}</h2>
          <button type="button" className={css.icon} aria-label={ru ? "Закрыть настройки API" : "Close API settings"} disabled={state.pending} onClick={onClose}><X size={19}/></button>
          <button type="submit" className={css.save} disabled={state.pending} aria-label={ru ? "Сохранить API" : "Save API"} title={ru ? "Сохранить" : "Save"}><Check size={20}/></button>
        </header>
        <fieldset disabled={state.pending}>
          <legend className={css.srOnly}>{ru ? "Подключение API" : "API connection"}</legend>
          <label className={css.field}>{ru ? "Название" : "Name"}<input maxLength={255} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder={ru ? "Название из документации" : "Use the documentation title"}/></label>
          <label className={css.field}>{ru ? "Ссылка на OpenAPI JSON или YAML" : "OpenAPI JSON or YAML URL"}<input required type="url" maxLength={2048} spellCheck={false} autoComplete="off" value={draft.sourceUrl} onChange={event => setDraft({ ...draft, sourceUrl: event.target.value })} placeholder="https://api.company.com/openapi.json"/></label>
          {duplicate && <div className={css.duplicate}><span>{ru ? "Этот адрес уже подключён:" : "This URL is already connected:"} {duplicate.name}</span><button type="button" onClick={() => onExisting(duplicate)}>{ru ? "Использовать подключение" : "Use existing connection"}</button></div>}
          <SourceCredentials source={source} draft={draft} ru={ru} onChange={setDraft}/>
          <SourceProjects projects={projects} draft={draft} ru={ru} onChange={setDraft}/>
          {source && <section className={css.lifecycle}><label className={css.check}><input type="checkbox" checked={draft.enabled} onChange={event => setDraft({ ...draft, enabled: event.target.checked })}/><span>{ru ? "API включён" : "API enabled"}</span></label>
            <p>{ru ? "Изменения документации и отключение действуют во всех связанных проектах. Чтобы убрать API только из одного проекта, снимите его выбор выше." : "Documentation changes and disabling apply to every linked project. To unlink a single project, deselect it above."}</p></section>}
        </fieldset>
        {state.pending && <p className={css.notice} role="status">{ru ? "Проверяем и сохраняем…" : "Checking and saving…"}</p>}
        {Boolean(state.error) && <div className={css.error} role="alert"><p>{apiSourceError(state.error, ru)}</p>
          {state.error instanceof TmsApiError && state.error.status === 412 && <button type="button" onClick={onReload}>{ru ? "Закрыть и обновить данные" : "Close and reload data"}</button>}</div>}
      </form>
    </motion.div>
  </motion.div>;
}
