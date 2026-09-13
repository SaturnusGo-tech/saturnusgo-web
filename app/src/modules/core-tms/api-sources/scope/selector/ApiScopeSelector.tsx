import { PortfolioIcon } from "../../../portfolios/presentation/icon/PortfolioIcon";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useRepositoryCatalog } from "../../../repository-scope/state/catalog/useRepositoryCatalog";
import { useApiContext } from "../useApiContext";
import type { ApiContext } from "../../model/api-source";
import css from "./scope.module.css";
export function ApiScopeSelector({ model }: { model: WorkspaceModel }) {
  const ru = useTmsLocale().locale === "ru";
  const scope = useApiContext(model.projectId); const portfolios = useRepositoryCatalog(model.data.workspace.id, true);
  const [open, setOpen] = useState(false); const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"projects" | "portfolios">("projects"); const [draft, setDraft] = useState<ApiContext>(scope.context);
  const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close); root.current?.querySelector("input")?.focus();
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const ids = scope.context.projectIds ?? [];
  const label = scope.context.portfolioId ? portfolios.items.find(p => p.id === scope.context.portfolioId)?.name ?? (ru ? "Портфель" : "Portfolio")
    : ids.length === 1 ? model.projects.find(p => p.id === ids[0])?.name ?? model.project?.name : `${ru ? "Проекты" : "Projects"} · ${ids.length}`;
  const items = (tab === "projects" ? model.projects : portfolios.items).filter(p => p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  async function apply() {
    setOpen(false);
    if (draft.projectIds?.length === 1 && draft.projectIds[0] !== model.projectId) {
      if (!await model.chooseProject(draft.projectIds[0]!)) return;
    }
    scope.select(draft); trigger.current?.focus();
  }
  return <div className={css.root} ref={root} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); trigger.current?.focus(); } }}>
    <button className={css.trigger} ref={trigger} type="button" aria-label={ru ? "Проекты или портфель для API" : "API projects or portfolio"}
      aria-expanded={open} aria-haspopup="dialog" onClick={() => { setDraft(scope.context); setTab(scope.context.portfolioId ? "portfolios" : "projects"); setSearch(""); setOpen(!open); }}>
      {scope.context.portfolioId && <PortfolioIcon size={16}/>}<strong>{label}</strong><ChevronDown size={15}/>
    </button>
    {open && <div className={css.menu} role="dialog" aria-label={ru ? "Область API" : "API scope"}>
      <div className={css.tabs}>{(["projects", "portfolios"] as const).map(value => <button key={value} type="button" aria-pressed={tab === value} onClick={() => { setTab(value); setSearch(""); }}>
        {value === "projects" ? (ru ? "Проекты" : "Projects") : (ru ? "Портфели" : "Portfolios")}</button>)}</div>
      <label className={css.search}><Search size={15}/><input value={search} onChange={event => setSearch(event.target.value)} aria-label={ru ? "Найти проект или портфель" : "Find a project or portfolio"} placeholder={ru ? "Поиск" : "Search"}/></label>
      <div className={css.list}>
        {tab === "portfolios" && portfolios.loading ? <p>{ru ? "Загрузка…" : "Loading…"}</p> : tab === "portfolios" && portfolios.error ? <button type="button" onClick={portfolios.retry}>{ru ? "Повторить загрузку" : "Retry"}</button> : items.map(item => <label className={css.option} key={item.id}>
          <input type={tab === "projects" ? "checkbox" : "radio"} name="api-scope" disabled={tab === "projects" && (draft.projectIds?.length ?? 0) >= 100 && !draft.projectIds?.includes(item.id)} checked={tab === "projects" ? Boolean(draft.projectIds?.includes(item.id)) : draft.portfolioId === item.id}
            onChange={() => setDraft(tab === "portfolios" ? { portfolioId: item.id } : { projectIds: draft.projectIds?.includes(item.id) ? draft.projectIds.filter(id => id !== item.id) : [...draft.projectIds ?? [], item.id] })}/>{tab === "portfolios" && <PortfolioIcon size={16} />}<span>{item.name}</span>
        </label>)}
      </div>
      <footer><button type="button" disabled={!draft.portfolioId && !draft.projectIds?.length} onClick={() => void apply()}>{ru ? "Применить" : "Apply"}</button></footer>
    </div>}
  </div>;
}
