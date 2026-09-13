import { PortfolioIcon } from "../../../portfolios/presentation/icon/PortfolioIcon";
import { Check, ChevronDown, Folder, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useRepositoryCatalog } from "../../state/catalog/useRepositoryCatalog";
import css from "./repository-selector.module.css";

export function RepositoryScopeSelector({ model }: { model: WorkspaceModel }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const ready = model.connection === "connected" || model.connection === "demo";
  const catalog = useRepositoryCatalog(model.data.workspace.id, model.connection === "connected");
  const scope = model.repositoryScope;
  const portfolio = model.portfolioRepository.catalog?.portfolio ?? catalog.items.find(item => item.id === scope.portfolioId);
  const [open, setOpen] = useState(false); const [kind, setKind] = useState<"projects" | "portfolios">("projects");
  const [selected, setSelected] = useState<string[]>([]); const [error, setError] = useState(false);
  const [search, setSearch] = useState(""); const [pending, setPending] = useState(false);
  const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  const label = ru ? "Проект или портфель" : "Project or portfolio";
  const loading = pending || !ready || Boolean(scope.portfolioId && catalog.loading);
  function close() { setOpen(false); trigger.current?.focus(); }
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    root.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  async function apply() {
    if (pending || !ready || !selected.length || model.isCaseSubmitting()) return;
    if (model.dialog === "case") { document.getElementById("case-editor-actions")?.focus(); return; }
    setPending(true); setError(false);
    try {
      let projectId = model.projectId;
      if (kind === "projects" && !selected.includes(projectId)) {
        projectId = selected[0];
        if (!await model.chooseProject(projectId)) { setError(true); return; }
      }
      scope.selectMany(kind, selected, projectId); close();
    } catch { setError(true); } finally { setPending(false); }
  }
  function selectKind(value: "projects" | "portfolios") {
    setKind(value); setSearch(""); setError(false);
    setSelected(value === "portfolios" ? scope.portfolioIds : scope.projectIds.length ? scope.projectIds : scope.portfolioId ? [] : [model.projectId]);
  }
  const selectionLabel = scope.portfolioIds.length > 1 ? (ru ? `Портфели · ${scope.portfolioIds.length}` : `Portfolios · ${scope.portfolioIds.length}`)
    : scope.projectIds.length > 1 ? (ru ? `Проекты · ${scope.projectIds.length}` : `Projects · ${scope.projectIds.length}`)
    : scope.portfolioId ? portfolio?.name ?? (ru ? "Портфель" : "Portfolio") : model.project?.name ?? label;
  const items = (kind === "projects" ? model.projects.filter(item => item.status !== "archived") : catalog.items).filter(item => item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <div className={css.root} ref={root} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    if (["ArrowDown", "ArrowUp"].includes(event.key) && open) {
      const options = [...(root.current?.querySelectorAll<HTMLButtonElement>("[role='menuitemcheckbox']") ?? [])];
      if (!options.length) return; event.preventDefault();
      const index = options.indexOf(document.activeElement as HTMLButtonElement);
      options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
    }
  }}>
    <button ref={trigger} className={css.trigger} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-busy={loading}
      disabled={loading} onClick={() => { selectKind(scope.portfolioId ? "portfolios" : "projects"); setOpen(!open); }}>
      {scope.portfolioId ? <PortfolioIcon size={16} /> : null}
      <strong className={loading ? css.skeleton : ""}>{loading ? "\u00a0" : selectionLabel}</strong>
      <ChevronDown size={15} />
    </button>
    {open && <div className={css.menu} role="menu" aria-label={label}>
      <div className={css.tabs} role="tablist" aria-label={label}>
        {(["projects", "portfolios"] as const).map(value => <button type="button" key={value} role="tab" aria-selected={kind === value}
          onClick={() => { selectKind(value); }}>
          {value === "projects" ? (ru ? "Проекты" : "Projects") : (ru ? "Портфели" : "Portfolios")}</button>)}
      </div>
      <label className={css.search} data-input-shell><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)}
        aria-label={ru ? "Найти проект или портфель" : "Find a project or portfolio"} placeholder={ru ? "Поиск" : "Search"} /></label>
      <div className={css.list}>
        {kind === "portfolios" && catalog.loading ? <div className={css.skeleton} role="status" aria-label={ru ? "Загрузка портфелей" : "Loading portfolios"} />
          : kind === "portfolios" && catalog.error ? <button type="button" onClick={catalog.retry}>{ru ? "Не удалось загрузить. Повторить" : "Could not load. Retry"}</button>
          : items.map(item => <button type="button" key={item.id} role="menuitemcheckbox"
            aria-checked={selected.includes(item.id)} disabled={pending} onClick={() => setSelected(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])}>
            {kind === "projects" ? <Folder size={16} /> : <PortfolioIcon size={16} />}<span>{item.name}</span>
            {(selected.includes(item.id)) && <Check size={15} />}</button>)}
        {!catalog.loading && !items.length && <p>{ru ? "Ничего не найдено" : "Nothing found"}</p>}
      </div>
      {error && <p role="alert">{ru ? "Не удалось применить выбор. Повторите." : "Could not apply selection. Retry."}</p>}
      <div className={css.selectionFooter}><span>{ru ? "Выбрано" : "Selected"}: {selected.length}</span>
        <button type="button" disabled={!selected.length || pending} onClick={() => void apply()}>{pending ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Применить" : "Apply")}</button></div>
      <button className={css.create} type="button" role="menuitem" onClick={() => { close(); model.openNewProject(); }}><Plus size={15} />{ru ? "Создать проект" : "Create project"}</button>
    </div>}
  </div>;
}
