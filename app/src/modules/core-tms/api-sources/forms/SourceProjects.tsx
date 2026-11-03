import { ChevronRight, Search } from "lucide-react";
import { useId, useState } from "react";
import type { ApiSourceDraft, NamedOption } from "../model/api-source";
import css from "../editor/editor.module.css";
export function SourceProjects({ draft, projects, ru, onChange }: { draft: ApiSourceDraft; projects: readonly NamedOption[]; ru: boolean; onChange: (draft: ApiSourceDraft) => void }) {
  const [search, setSearch] = useState(""); const visible = projects.filter(p => p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const [open, setOpen] = useState(false), id = useId();
  const selected = projects.filter(project => draft.projectIds.includes(project.id));
  const summary = draft.allProjects ? (ru ? "Все проекты" : "All projects") : draft.projectIds.length === 1 && selected[0] ? selected[0].name : draft.projectIds.length ? (ru ? `Проектов: ${draft.projectIds.length}` : `${draft.projectIds.length} projects`) : (ru ? "Выбрать проекты" : "Choose projects");
  return <section className={css.option} aria-label={ru ? "Используется в проектах" : "Used in projects"}>
    <button type="button" className={css.optionTrigger} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <span>{ru ? "Используется в проектах" : "Used in projects"}</span><span className={css.optionValue}>{summary}<ChevronRight size={16} data-open={open || undefined}/></span>
    </button>
    {open && <div id={id} className={css.optionBody}>
    <label className={css.check}><input type="checkbox" checked={draft.allProjects} onChange={event => onChange({ ...draft, allProjects: event.target.checked, projectIds: [] })}/>
      <span>{ru ? "Все проекты рабочего пространства" : "All workspace projects"}</span></label>
    {draft.allProjects ? <p>{ru ? "Включая проекты, которые будут созданы позже." : "Includes projects created in the future."}</p> : <>
      {projects.length > 6 && <label className={css.search} data-input-shell><Search size={15}/><input value={search} onChange={event => setSearch(event.target.value)} aria-label={ru ? "Найти проект" : "Find a project"} placeholder={ru ? "Найти проект" : "Find a project"}/></label>}
      <div className={css.projectList}>{visible.map(project => <label className={css.check} key={project.id}>
        <input type="checkbox" checked={draft.projectIds.includes(project.id)} onChange={() => onChange({ ...draft, projectIds: draft.projectIds.includes(project.id) ? draft.projectIds.filter(id => id !== project.id) : [...draft.projectIds, project.id] })}/><span>{project.name}</span>
      </label>)}</div>
      {!draft.projectIds.length && <small>{ru ? "API сохранится без привязки к проектам." : "This API will be saved without project links."}</small>}
    </>}
    </div>}
  </section>;
}
