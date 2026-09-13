import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useApiSourceList } from "../state/useApiSourceList";
import { useApiProjects } from "../state/projects/useApiProjects";
import { SourceEditor } from "../editor/SourceEditor";
import type { ApiSource } from "../model/api-source";
import { apiSourceError } from "../model/api-source-error";
import css from "./sources.module.css";
export function ApiSourceManager({ workspaceId, projectId, onBack, onSaved }: { workspaceId: string; projectId: string; onBack: () => void; onSaved?: (source: ApiSource) => void }) {
  const ru = useTmsLocale().locale === "ru"; const catalog = useApiSourceList(workspaceId, {}, true);
  const projects = useApiProjects(workspaceId); const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ApiSource | "new" | null>(null);
  const visible = catalog.items.filter(source => `${source.name} ${source.sourceUrl}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <section className={css.manager}>
    <header><button type="button" className={css.back} onClick={onBack}><ArrowLeft size={16}/>{ru ? "Назад" : "Back"}</button>
      <h1>{ru ? "Подключённые API" : "Connected APIs"}</h1><button className={css.primary} type="button" disabled={projects.loading || projects.error || catalog.loading || Boolean(catalog.error)} onClick={() => setEditing("new")}><Plus size={17}/>{ru ? "Подключить API" : "Connect API"}</button></header>
    <label className={css.search}><Search size={16}/><input aria-label={ru ? "Найти API" : "Find API"} placeholder={ru ? "Найти API" : "Find API"} value={search} onChange={event => setSearch(event.target.value)}/></label>
    {catalog.loading && <div className={css.skeleton} role="status" aria-label={ru ? "Загрузка API" : "Loading APIs"}/>}
    {(catalog.error || projects.error) && <div className={css.state} role="alert"><p>{apiSourceError(catalog.error,ru)}</p><button type="button" onClick={() => { catalog.refresh(); projects.retry(); }}>{ru ? "Повторить" : "Retry"}</button></div>}
    {!catalog.loading && !catalog.error && <div className={css.rows}>{visible.map(source => <button type="button" className={css.row} key={source.id} disabled={projects.loading || projects.error} onClick={() => setEditing(source)}>
      <span><strong>{source.name}</strong><small>{source.sourceUrl}</small></span>
      <span className={css.projectNames}>{source.allProjects ? (ru ? "Все проекты" : "All projects") : source.projectIds.length ? source.projectIds.map(id => projects.items.find(project => project.id === id)?.name ?? (ru ? "Архивный проект" : "Archived project")).join(", ") : (ru ? "Без проектов" : "No projects")}</span>
      {!source.enabled && <small>{ru ? "Отключён" : "Disabled"}</small>}<ChevronRight size={15}/>
    </button>)}</div>}
    {!catalog.loading && !catalog.error && !visible.length && <div className={css.state}><h2>{search ? (ru ? "Ничего не найдено" : "No results") : (ru ? "Пока нет подключённых API" : "No APIs connected yet")}</h2></div>}
    <AnimatePresence>{editing !== null && <SourceEditor key={editing === "new" ? "new" : editing.id} workspaceId={workspaceId} projectId={projectId}
      source={editing === "new" ? null : editing} catalog={catalog.items} projects={projects.items} ru={ru} onClose={() => setEditing(null)}
      onReload={() => { setEditing(null); catalog.refresh(); }} onExisting={source => setEditing(source)} onSaved={source => { setEditing(null); catalog.refresh(); onSaved?.(source); }}/>}</AnimatePresence>
  </section>;
}
