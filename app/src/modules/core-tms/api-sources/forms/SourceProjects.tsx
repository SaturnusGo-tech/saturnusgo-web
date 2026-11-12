import { IntegrationCheckbox } from "../../presentation/common/integration-controls/checkbox/IntegrationCheckbox";
import { IntegrationInput } from "../../presentation/common/integration-controls/input/IntegrationInput";
import { Search } from "lucide-react";
import { useState } from "react";
import type { ApiSourceDraft, NamedOption } from "../model/api-source";
import { SourceDisclosure } from "../editor/disclosure/SourceDisclosure";
import css from "../editor/editor.module.css";
export function SourceProjects({ draft, projects, ru, disabled = false, onChange }: { draft: ApiSourceDraft; projects: readonly NamedOption[]; ru: boolean; disabled?: boolean; onChange: (draft: ApiSourceDraft) => void }) {
  const [search, setSearch] = useState(""); const visible = projects.filter(p => p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const selected = projects.filter(project => draft.projectIds.includes(project.id));
  const summary = draft.allProjects ? (ru ? "Все проекты" : "All projects") : draft.projectIds.length === 1 && selected[0] ? selected[0].name : draft.projectIds.length ? (ru ? `Проектов: ${draft.projectIds.length}` : `${draft.projectIds.length} projects`) : (ru ? "Без проектов" : "No projects");
  return <SourceDisclosure title={ru ? "Доступно в проектах" : "Available in projects"} summary={summary} disabled={disabled}>
    <IntegrationCheckbox isDisabled={disabled} isSelected={draft.allProjects} className={css.check}
      onValueChange={allProjects => onChange({ ...draft, allProjects, projectIds: [] })}>
      {ru ? "Все проекты рабочего пространства" : "All workspace projects"}
    </IntegrationCheckbox>
    {draft.allProjects ? <p>{ru ? "Включая проекты, которые будут созданы позже." : "Includes projects created in the future."}</p> : <>
      {projects.length > 6 && <IntegrationInput aria-label={ru ? "Найти проект" : "Find a project"}
        value={search} onValueChange={setSearch} placeholder={ru ? "Найти проект" : "Find a project"} isDisabled={disabled} startContent={<Search size={15} aria-hidden="true"/>}
        className={css.search}/ >}
      <div className={css.projectList}>{visible.map(project => <IntegrationCheckbox key={project.id} isDisabled={disabled}
        isSelected={draft.projectIds.includes(project.id)} className={css.check}
        onValueChange={selected => onChange({ ...draft, projectIds: selected ? [...draft.projectIds, project.id] : draft.projectIds.filter(id => id !== project.id) })}>
        {project.name}
      </IntegrationCheckbox>)}</div>
      {!visible.length && <p>{search ? (ru ? "Проекты не найдены." : "No matching projects.") : (ru ? "В рабочем пространстве пока нет проектов." : "No projects in this workspace yet.")}</p>}
      {!draft.projectIds.length && <small>{ru ? "API сохранится без привязки к проектам." : "This API will be saved without project links."}</small>}
    </>}
  </SourceDisclosure>;
}
