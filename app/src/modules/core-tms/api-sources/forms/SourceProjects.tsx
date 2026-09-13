import { Search } from "lucide-react";
import { useState } from "react";
import type { ApiSourceDraft, NamedOption } from "../model/api-source";
import css from "../editor/editor.module.css";
export function SourceProjects({ draft, projects, ru, onChange }: { draft: ApiSourceDraft; projects: readonly NamedOption[]; ru: boolean; onChange: (draft: ApiSourceDraft) => void }) {
  const [search, setSearch] = useState(""); const visible = projects.filter(p => p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <section className={css.projects} aria-label={ru ? "Используется в проектах" : "Used in projects"}>
    <h3>{ru ? "Используется в проектах" : "Used in projects"}</h3>
    <label className={css.check}><input type="checkbox" checked={draft.allProjects} onChange={event => onChange({ ...draft, allProjects: event.target.checked, projectIds: [] })}/>
      <span>{ru ? "Все проекты рабочего пространства" : "All workspace projects"}</span></label>
    {draft.allProjects ? <p>{ru ? "Включая проекты, которые будут созданы позже." : "Includes projects created in the future."}</p> : <>
      <label className={css.search}><Search size={15}/><input value={search} onChange={event => setSearch(event.target.value)} aria-label={ru ? "Найти проект" : "Find a project"} placeholder={ru ? "Найти проект" : "Find a project"}/></label>
      <div className={css.projectList}>{visible.map(project => <label className={css.check} key={project.id}>
        <input type="checkbox" checked={draft.projectIds.includes(project.id)} onChange={() => onChange({ ...draft, projectIds: draft.projectIds.includes(project.id) ? draft.projectIds.filter(id => id !== project.id) : [...draft.projectIds, project.id] })}/><span>{project.name}</span>
      </label>)}</div>
      {!draft.projectIds.length && <small>{ru ? "API сохранится без привязки к проектам." : "This API will be saved without project links."}</small>}
    </>}
  </section>;
}
