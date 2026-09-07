import { useEffect, useState } from "react";
import type { Catalog } from "../../connectors/model/connector-types";
import type { ImpactPermissions, ImpactScope } from "../model/impact-types";
import { impactHref, readImpactSelection } from "../navigation/impact-navigation";
import { AnalysisList } from "./list/AnalysisList";
import { AnalysisDetail } from "./detail/AnalysisDetail";
import { RepositorySettings } from "./repositories/RepositorySettings";
import css from "./styles/impact.module.css";
export function ImpactWorkspace({ scope, ru, permissions, catalog, connectionId }: {
  scope: ImpactScope; ru: boolean; permissions: ImpactPermissions; catalog: Catalog; connectionId: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(() => typeof window === "undefined" ? null : readImpactSelection(window.location.href, scope));
  const [tab, setTab] = useState<"analyses" | "repositories">("analyses");
  useEffect(() => {
    const sync = () => { setSelected(readImpactSelection(window.location.href, scope)); setTab("analyses"); };
    window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync);
  }, [scope.workspaceId, scope.projectId]);
  const open = (id: string | null) => { window.history.replaceState(window.history.state, "", impactHref(window.location.href, scope, id)); setSelected(id); };
  if (!permissions.read) return <p className={css.notice}>{ru ? "Анализ доступен после подключения и проверки прав проекта." : "Analysis is available after connecting and checking project access."}</p>;
  return <div className={css.root}>
    {!selected && <div className={css.tabs} aria-label={ru ? "Разделы Impact Analysis" : "Impact Analysis sections"}>
      <button type="button" aria-pressed={tab === "analyses"} onClick={() => setTab("analyses")}>{ru ? "Анализы" : "Analyses"}</button>
      <button type="button" aria-pressed={tab === "repositories"} onClick={() => setTab("repositories")}>{ru ? "Репозитории" : "Repositories"}</button></div>}
    {selected ? <AnalysisDetail key={selected} scope={scope} id={selected} ru={ru} permissions={permissions} onBack={() => open(null)} />
      : tab === "analyses" ? <AnalysisList scope={scope} ru={ru} enabled={permissions.read} onSelect={open} />
        : <RepositorySettings scope={scope} ru={ru} permissions={permissions} catalog={catalog} connectionId={connectionId} />}
  </div>;
}
