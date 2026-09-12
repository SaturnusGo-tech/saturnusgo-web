import { BriefcaseBusiness, Check, ChevronDown, Folder, Plus, Search } from "lucide-react";
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
  async function select(id: string) {
    if (pending || !ready || model.isCaseSubmitting()) return;
    if (model.dialog === "case") { document.getElementById("case-editor-actions")?.focus(); return; }
    close(); setPending(true);
    try {
      if (kind === "portfolios") { scope.select(id); return; }
      if (id === model.projectId || await model.chooseProject(id)) scope.select(null, id);
    } finally { setPending(false); }
  }
  const items = (kind === "projects" ? model.projects : catalog.items).filter(item => item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <div className={css.root} ref={root} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    if (["ArrowDown", "ArrowUp"].includes(event.key) && open) {
      const options = [...(root.current?.querySelectorAll<HTMLButtonElement>("[role='menuitemradio']") ?? [])];
      if (!options.length) return; event.preventDefault();
      const index = options.indexOf(document.activeElement as HTMLButtonElement);
      options[(index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length]?.focus();
    }
  }}>
    <button ref={trigger} className={css.trigger} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-busy={loading}
      disabled={loading} onClick={() => { setKind(scope.portfolioId ? "portfolios" : "projects"); setSearch(""); setOpen(!open); }}>
      {scope.portfolioId ? <BriefcaseBusiness size={16} /> : null}
      <strong className={loading ? css.skeleton : ""}>{loading ? "\u00a0" : scope.portfolioId ? portfolio?.name ?? (ru ? "Портфель" : "Portfolio") : model.project?.name ?? label}</strong>
      <ChevronDown size={15} />
    </button>
    {open && <div className={css.menu} role="menu" aria-label={label}>
      <div className={css.tabs} role="tablist" aria-label={label}>
        {(["projects", "portfolios"] as const).map(value => <button type="button" key={value} role="tab" aria-selected={kind === value}
          onClick={() => { setKind(value); setSearch(""); }}>
          {value === "projects" ? (ru ? "Проекты" : "Projects") : (ru ? "Портфели" : "Portfolios")}</button>)}
      </div>
      <label className={css.search} data-input-shell><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)}
        aria-label={ru ? "Найти проект или портфель" : "Find a project or portfolio"} placeholder={ru ? "Поиск" : "Search"} /></label>
      <div className={css.list}>
        {kind === "portfolios" && catalog.loading ? <div className={css.skeleton} role="status" aria-label={ru ? "Загрузка портфелей" : "Loading portfolios"} />
          : kind === "portfolios" && catalog.error ? <button type="button" onClick={catalog.retry}>{ru ? "Не удалось загрузить. Повторить" : "Could not load. Retry"}</button>
          : items.map(item => <button type="button" key={item.id} role="menuitemradio"
            aria-checked={kind === "portfolios" ? scope.portfolioId === item.id : !scope.portfolioId && model.projectId === item.id} onClick={() => void select(item.id)}>
            {kind === "projects" ? <Folder size={16} /> : <BriefcaseBusiness size={16} />}<span>{item.name}</span>
            {(kind === "portfolios" ? scope.portfolioId === item.id : !scope.portfolioId && model.projectId === item.id) && <Check size={15} />}</button>)}
        {!catalog.loading && !items.length && <p>{ru ? "Ничего не найдено" : "Nothing found"}</p>}
      </div>
      <button className={css.create} type="button" role="menuitem" onClick={() => { close(); model.openNewProject(); }}><Plus size={15} />{ru ? "Создать проект" : "Create project"}</button>
    </div>}
  </div>;
}
