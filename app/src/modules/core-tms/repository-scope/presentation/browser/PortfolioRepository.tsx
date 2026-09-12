import { ArrowUpRight, ChevronDown, Folder } from "lucide-react";
import { useMemo, useState } from "react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { SelectionControls, useSelectionFilters } from "../../../presentation/cases/selection/controls/SelectionControls";
import { PortfolioCaseTree } from "./PortfolioCaseTree";
import { useRepositoryWidth, REPOSITORY_MIN, REPOSITORY_MAX } from "../../../folders/presentation/resize/useRepositoryWidth";
import { useNavigationValue } from "../../../state/navigation/context/useNavigationValue";
import shared from "../../../folders/presentation/styles/repository.module.css";
import css from "./portfolio-repository.module.css";

export function PortfolioRepository({ model }: { model: WorkspaceModel }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const id = model.repositoryScope.portfolioId!;
  const resource = model.portfolioRepository;
  const resize = useRepositoryWidth();
  const [collapsed, setCollapsed] = useNavigationValue<string[]>(`repository:${id}:collapsed`, []);
  const [opening, setOpening] = useState<string | null>(null); const [error, setError] = useState(false);
  const branches = useMemo(() => {
    const result = new Map(resource.branches);
    if (result.get(model.projectId) && !model.folders.loading && !model.folders.error) {
      result.set(model.projectId, { cases: model.projectCases, folders: [...model.folders.items] });
    }
    return result;
  }, [resource.branches, model.projectId, model.projectCases, model.folders.items, model.folders.loading, model.folders.error]);
  const allCases = useMemo(() => [...branches.values()].flatMap(branch => branch?.cases ?? []), [branches]);
  const filters = useSelectionFilters(allCases);
  const visibleIds = useMemo(() => new Set(filters.visible.map(item => item.id)), [filters.visible]);
  const filtered = Boolean(filters.query || filters.qlQuery || filters.facets.owners?.length || filters.facets.folders.length
    || filters.facets.components.length || filters.filters.tag || filters.filters.type !== "all" || filters.filters.priority !== "all" || filters.filters.lifecycle !== "all");
  const locked = Boolean(opening || model.dialog === "case");
  async function openCase(item: TestCaseSummary) {
    if (locked) return;
    setOpening(item.id); setError(false);
    try {
      if (item.projectId !== model.projectId && !await model.chooseProject(item.projectId)) { setError(true); return; }
      model.setSelectedCaseId(item.id); model.setSelectedFolder(item.folderPath); model.setSelectedFolderId(item.folderId ?? ""); model.setEditing(false);
    } catch { setError(true); } finally { setOpening(null); }
  }
  const projects = resource.catalog?.projects ?? [];
  return <aside ref={resize.ref} style={resize.style} data-repository-tree className={`${shared.repository} ${css.pane}`}
    aria-label={ru ? "Репозиторий портфеля" : "Portfolio repository"}>
    <header className={shared.heading}><strong>{ru ? "Репозиторий" : "Repository"}</strong></header>
    <SelectionControls state={filters} ru={ru} disabled={locked} />
    <div className={css.caption}><strong>{resource.catalog?.portfolio.name ?? (ru ? "Портфель" : "Portfolio")}</strong>
      {!resource.loading && !resource.error && ![...branches.values()].some(branch => branch === null) && <span>{filters.visible.length}</span>}</div>
    {error && <p className={css.message} role="alert">{ru ? "Не удалось открыть кейс. Попробуйте ещё раз." : "Could not open the case. Please try again."}</p>}
    <div className={shared.treeScroll} aria-busy={resource.loading || Boolean(opening)}>
      {resource.error && <div className={shared.loadError} role="alert"><span>{ru ? "Портфель недоступен или не удалось загрузить проекты." : "The portfolio is unavailable or its projects could not be loaded."}</span>
        <button type="button" onClick={resource.retry}>{ru ? "Повторить" : "Retry"}</button></div>}
      {resource.loading && <div className={shared.skeleton} role="status" aria-label={ru ? "Загрузка кейсов портфеля" : "Loading portfolio cases"}><i /><i /><i /></div>}
      {projects.map(project => {
        const branch = branches.get(project.id);
        const cases = branch?.cases.filter(item => visibleIds.has(item.id)) ?? [];
        if (filtered && branch && !cases.length) return null;
        const expanded = filtered || !collapsed.includes(project.id);
        return <section className={css.project} key={project.id}>
          <div className={css.projectHeading}>
            <button type="button" disabled={locked} aria-expanded={expanded} onClick={() => setCollapsed(current => current.includes(project.id) ? current.filter(value => value !== project.id) : [...current, project.id])}>
              <ChevronDown size={14} className={css.chevron} data-open={expanded} /><Folder size={16} /><strong>{project.name}</strong>{branch && <small>{cases.length}</small>}</button>
            <button type="button" disabled={locked} aria-label={`${ru ? "Открыть только проект" : "Open project only"}: ${project.name}`}
              title={ru ? "Только этот проект" : "Only this project"} onClick={() => model.repositoryScope.select(null, project.id)}><ArrowUpRight size={16} /></button>
          </div>
          {expanded && <div className={css.contents}>
            {branch === null ? <div className={shared.loadError} role="alert"><span>{ru ? "Кейсы проекта не загружены" : "Project cases could not be loaded"}</span><button type="button" onClick={resource.retry}>{ru ? "Повторить" : "Retry"}</button></div>
              : !branch ? null : cases.length ? <PortfolioCaseTree cases={cases} folders={branch.folders} workspaceId={model.data.workspace.id} ru={ru} disabled={locked}
                activeId={model.selectedCaseId} includeArchived={filters.filters.includeArchived} onOpen={item => void openCase(item)} />
                : <p className={css.message}>{ru ? "В проекте пока нет кейсов" : "This project has no cases yet"}</p>}
          </div>}
        </section>;
      })}
      {!resource.loading && !resource.error && !projects.length && <p className={css.message}>{ru ? "В портфеле пока нет активных проектов" : "This portfolio has no active projects yet"}</p>}
      {!resource.loading && !resource.error && filtered && !filters.visible.length && <p className={css.message}>{ru ? "Кейсы не найдены. Измените поиск или фильтры." : "No matching cases. Adjust the search or filters."}</p>}
    </div>
    <div {...resize.handleProps} className={shared.resizeHandle} role="separator" tabIndex={0} aria-orientation="vertical"
      aria-label={ru ? "Изменить ширину репозитория" : "Resize repository"} aria-valuemin={REPOSITORY_MIN} aria-valuemax={REPOSITORY_MAX} aria-valuenow={resize.width} />
  </aside>;
}
