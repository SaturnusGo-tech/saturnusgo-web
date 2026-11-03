import { ChevronRight, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useApiSourceList } from "../state/useApiSourceList";
import { useApiProjects } from "../state/projects/useApiProjects";
import { SourceEditor } from "../editor/SourceEditor";
import { ApiSourceIcon } from "./identity/ApiSourceIcon";
import type { ApiSource } from "../model/api-source";
import { apiSourceError } from "../model/api-source-error";
import { transitionContent } from "../../presentation/workspace/motion/transition/content-transition";
import css from "./sources.module.css";
export function ApiSourceManager({ workspaceId, projectId, onBack, onSaved, embedded = false }: { workspaceId: string; projectId: string; onBack: () => void; onSaved?: (source: ApiSource) => void; embedded?: boolean }) {
  const ru = useTmsLocale().locale === "ru", catalog = useApiSourceList(workspaceId, {}, true), projects = useApiProjects(workspaceId);
  const [editing, setEditing] = useState<ApiSource | "new" | null>(null), [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false), heading = useRef<HTMLHeadingElement>(null);
  const ready = !catalog.loading && !catalog.error && !projects.loading && !projects.error;
  const target = editing ?? (ready && !catalog.items.length && !saved ? "new" : null);
  useEffect(() => { if (target === null) heading.current?.focus({ preventScroll: true }); }, [target]);
  const select = (source: ApiSource | "new" | null) => transitionContent(() => { setEditing(source); setSaved(""); });
  const close = () => { if (!catalog.items.length) onBack(); else select(null); };
  const Heading = embedded ? "h3" : "h1";
  return <section className={css.manager} data-embedded={embedded || undefined}>
    {target !== null ? <>
      <nav className={css.breadcrumb} aria-label={ru ? "Навигация Swagger" : "Swagger navigation"}><button type="button" disabled={pending} onClick={onBack}>Swagger</button><ChevronRight size={15}/>
        {catalog.items.length > 0 && <><button type="button" disabled={pending} onClick={() => select(null)}>{ru ? "Подключения" : "Connections"}</button><ChevronRight size={15}/></>}
        <span>{target === "new" ? (ru ? "Подключение" : "Connect") : target.name}</span></nav>
      <SourceEditor key={target === "new" ? "new" : target.id} workspaceId={workspaceId} projectId={projectId}
        source={target === "new" ? null : target} catalog={catalog.items} projects={projects.items} ru={ru} onClose={close} onPendingChange={setPending}
        onReload={() => { setPending(false); setEditing(null); catalog.refresh(); projects.retry(); }} onExisting={source => select(source)}
        onSaved={source => { setPending(false); setEditing(null); setSaved(source.name); catalog.refresh(); onSaved?.(source); }}/>
    </> : <>
      <nav className={css.breadcrumb} aria-label={ru ? "Навигация Swagger" : "Swagger navigation"}><button type="button" disabled={pending} onClick={onBack}>Swagger</button><ChevronRight size={15}/><span>{ru ? "Подключения" : "Connections"}</span></nav>
      {catalog.items.length > 0 && <header><Heading ref={heading} tabIndex={-1}>{ru ? "Подключённые API" : "API connections"}<span className={css.total}>{catalog.items.length}</span></Heading><button className={css.primary} type="button" disabled={!ready} onClick={() => select("new")}><Plus size={16}/>{ru ? "Подключить API" : "Connect API"}</button></header>}
      {saved && <p className={css.notice} role="status">{ru ? `Подключение «${saved}» сохранено.` : `${saved} connection saved.`}</p>}
      {(catalog.loading || projects.loading) && <div className={css.skeleton} role="status" aria-label={ru ? "Загрузка подключений" : "Loading connections"}/>}
      {(catalog.error || projects.error) && <div className={css.state} role="alert"><p>{apiSourceError(catalog.error || projects.error,ru)}</p><button type="button" onClick={() => { catalog.refresh(); projects.retry(); }}>{ru ? "Повторить" : "Retry"}</button></div>}
      {!catalog.loading && !catalog.error && catalog.items.length > 0 && <section className={css.repository} aria-label={ru ? "Подключённые API" : "API connections"}>
        <div className={css.columns} aria-hidden="true"><span>API</span><span>{ru ? "Проекты" : "Projects"}</span><span>{ru ? "Статус" : "Status"}</span><span/></div>
        <ul className={css.rows}>{catalog.items.map(source => {
          const names = source.allProjects ? (ru ? "Все проекты" : "All projects") : source.projectIds.length ? source.projectIds.map(id => projects.items.find(project => project.id === id)?.name ?? (ru ? "Архивный проект" : "Archived project")).join(", ") : (ru ? "Без проектов" : "No projects");
          return <li key={source.id}><button type="button" className={css.row} disabled={!ready} onClick={() => select(source)}>
            <span className={css.identity}><ApiSourceIcon id={source.id}/><span className={css.copy}><strong title={source.name}>{source.name}</strong><small title={source.sourceUrl}>{source.sourceUrl}</small></span></span>
            <span className={css.projectNames} title={names}>{names}</span>
            <span className={css.status} data-enabled={source.enabled || undefined}><i aria-hidden="true"/>{source.enabled ? (ru ? "Включён" : "Enabled") : (ru ? "Отключён" : "Disabled")}</span><ChevronRight size={15}/>
          </button></li>;
        })}</ul>
      </section>}
    </>}
  </section>;
}
