import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { Environment } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { EnvironmentEditor } from "../environments/editor/EnvironmentEditor";
import { EnvironmentExpansion } from "../environments/motion/EnvironmentExpansion";
import { EnvironmentRow } from "../environments/row/EnvironmentRow";
import { transitionEnvironmentLayout } from "../environments/motion/layout-transition";
import { ENVIRONMENT_SETTINGS_OPEN } from "../navigation/settings-section-route";
import css from "../environments/environments.module.css";

export function EnvironmentSettings({ environments, projectId, projectName, offline, onSaved, onToggle }: {
  environments: Environment[]; projectId: string; projectName: string; offline: boolean;
  onSaved(environment: Environment): void; onToggle(id: string): void;
}) {
  const { t, locale } = useTmsLocale(); const ru = locale === "ru";
  const [copied, setCopied] = useState(""); const [error, setError] = useState("");
  const [query, setQuery] = useState(""); const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const reset = () => { if (!busy) setEditing(null); };
    window.addEventListener(ENVIRONMENT_SETTINGS_OPEN, reset);
    return () => window.removeEventListener(ENVIRONMENT_SETTINGS_OPEN, reset);
  }, [busy]);
  const select = (id: string | null) => { if (!busy) transitionEnvironmentLayout(() => setEditing(id)); };
  async function copy(environment: Environment) {
    try { await navigator.clipboard.writeText(environment.baseUrl); setCopied(environment.id); setError(""); }
    catch { setError(ru ? "Не удалось скопировать адрес. Выделите его и скопируйте вручную." : "Could not copy the URL. Select and copy it manually."); }
  }
  const editor = (environment?: Environment) => <EnvironmentEditor key={environment?.id ?? "new"} projectId={projectId} environment={environment} offline={offline}
    onClose={() => select(null)} onBusy={setBusy} onSaved={saved => transitionEnvironmentLayout(() => { onSaved(saved); setEditing(null); })} />;
  const matching = environments.filter(item => item.id === editing || `${item.name} ${item.key} ${item.baseUrl}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div className={css.environments}>
    <header className={css.header}><div><h2 id="settings-environments-title">{ru ? "Окружения" : "Environments"} <span>{environments.length}</span></h2>
      <p>{ru ? `Стенды для проверок в ${projectName}.` : `Test environments in ${projectName}.`}</p></div>
      <button className={css.create} type="button" onClick={() => select("new")} disabled={busy || editing === "new"} data-testid="new-environment"><Plus size={14}/>{t("config.newEnvironment")}</button></header>
    <label className={css.search}><Search size={14}/><input type="search" aria-label={ru ? "Найти окружение" : "Find an environment"}
      placeholder={ru ? "Найти окружение" : "Find an environment"} value={query} disabled={busy} onChange={event => setQuery(event.target.value)} /></label>
    {error && <p role="alert" className={css.error}>{error}</p>}
    <div className={`${css.row} ${css.columns}`} aria-hidden="true"><span>{ru ? "Окружение" : "Environment"}</span><span>{ru ? "Ключ" : "Key"}</span><span>{ru ? "Адрес стенда" : "Base URL"}</span><span/></div>
    <div style={{ viewTransitionName: "environment-create" }}><EnvironmentExpansion>{editing === "new" && editor()}</EnvironmentExpansion></div>
    <ul className={css.list}>{matching.map(environment => <EnvironmentRow key={environment.id} environment={environment}
      editor={editing === environment.id ? editor(environment) : undefined} disabled={busy}
      copied={copied === environment.id} onCopy={() => void copy(environment)} onEdit={() => select(editing === environment.id ? null : environment.id)} onToggle={() => { select(null); onToggle(environment.id); }} />)}</ul>
    {!matching.length && editing !== "new" && <div className={css.empty}>
      {!environments.length && <img src="/falcon/ui/environment-server.webp" width="72" height="48" alt="" />}
      <p>{environments.length ? (ru ? "Окружения не найдены" : "No environments found") : t("config.emptyEnvironments")}</p></div>}
    <span className={css.srOnly} role="status">{copied ? (ru ? "Адрес скопирован" : "URL copied") : ""}</span>
  </div>;
}
