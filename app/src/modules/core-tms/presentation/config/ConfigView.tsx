import { AvatarProfile, Bell, ColorTheme, Cube, Download, Plugin, Search, Settings, X } from "@openai/apps-sdk-ui/components/Icon";
import { transitionContent } from "../workspace/motion/transition/content-transition";
import { useState, type ReactNode } from "react";
import { CreditCard, KeyRound } from "lucide-react";
import type { Environment, Project } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { AppearanceSettings } from "./settings/AppearanceSettings";
import { AccountSettings } from "./settings/AccountSettings";
import { SecuritySettings } from "./security/SecuritySettings";
import { ProjectSettings } from "./sections/ProjectSettings";
import { EnvironmentSettings } from "./sections/EnvironmentSettings";
import { settingsCopy, settingsSections } from "./navigation/settings-sections";
import { useSettingsSection } from "./navigation/state/useSettingsSection";
import css from "./config.module.css";

type ConfigViewProps = {
  environments: Environment[]; project?: Project; notifications?: ReactNode; plugins?: ReactNode; billing?: ReactNode;
  offline: boolean; onEnvironmentSaved: (environment: Environment) => void;
  onToggleEnvironment: (id: string) => void; workspaceId: string; canManageProject: boolean;
  onProjectUpdated: (project: Project, etag: string | null) => void;
  onToggleProject: () => void; exchange: ReactNode;
};
const icons = { general: Settings, environments: Cube, exchange: Download, billing: CreditCard, appearance: ColorTheme, notifications: Bell, security: KeyRound, account: AvatarProfile, plugins: Plugin };
export function ConfigView(props: ConfigViewProps) {
  const { locale } = useTmsLocale();
  const copy = settingsCopy[locale];
  const [query, setQuery] = useState("");
  const { section, select } = useSettingsSection(Boolean(props.project));
  if (section === "billing") return <div className={css.page} data-testid="config-view" data-layout="billing">
    <section id="settings-billing" className={css.billingContent} hidden={false} aria-label={copy.billing[0]}>
      {props.billing || <p role="status">{locale === "ru" ? "Войдите в рабочее пространство, чтобы посмотреть тариф и оплату." : "Sign in to a workspace to view plan and billing."}</p>}
    </section>
  </div>;
  const available = props.project ? settingsSections : settingsSections.filter(id => ["billing", "appearance", "notifications", "security", "account", "plugins"].includes(id));
  const matching = available.filter(id => copy[id].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const groups = [{ label: copy.projectGroup, ids: matching.filter(id => ["general", "environments", "exchange"].includes(id)) },
    { label: copy.workspaceGroup, ids: matching.filter(id => id === "billing") },
    { label: copy.personalGroup, ids: matching.filter(id => ["appearance", "notifications", "security", "account"].includes(id)) },
    { label: copy.integrationsGroup, ids: matching.filter(id => id === "plugins") }];
  return <div className={css.page} data-testid="config-view">
    <aside className={css.sidebar}>
      <h1>{copy.title}</h1>
      <div className={css.search} data-input-shell>
        <Search width={18} height={18} aria-hidden="true" />
        <input type="search" aria-label={copy.search} placeholder={copy.search} value={query}
          aria-controls="settings-navigation" onChange={event => setQuery(event.target.value)} />
        {query && <button type="button" aria-label={copy.clearSearch} onClick={() => setQuery("")}><X width={15} height={15} aria-hidden="true" /></button>}
      </div>
      <nav id="settings-navigation" aria-label={copy.title}>
        {groups.filter(group => group.ids.length).map(group => <div key={group.label} className={css.navGroup}>
          <div className={css.navLabel}>{group.label}
            {group.label === copy.projectGroup && <span title={props.project?.name}>{props.project?.name}</span>}</div>
          {group.ids.map(id => {
            const Icon = icons[id];
            return <button key={id} type="button" aria-current={section === id ? "page" : undefined} aria-controls={`settings-${id}`}
              onClick={() => transitionContent(() => select(id))}><Icon width={18} height={18} aria-hidden="true" />{copy[id][0]}</button>;
          })}
        </div>)}
        {!matching.length && <p className={css.searchEmpty} role="status">{copy.noResults}</p>}
      </nav>
    </aside>
    <div className={css.content}>
      {available.map((id) => <section key={id} id={`settings-${id}`} hidden={section !== id} aria-labelledby={id === "plugins" || id === "exchange" || id === "billing" ? undefined : `settings-${id}-title`} aria-label={id === "plugins" || id === "exchange" || id === "billing" ? copy[id][0] : undefined} className={css.panel} data-layout={id === "general" || id === "exchange" ? "rows" : undefined}>
        {id !== "environments" && id !== "plugins" && id !== "exchange" && id !== "billing" && <header className={css.header}>
          <h2 id={`settings-${id}-title`}>{copy[id][0]}</h2><p>{copy[id][1]}</p></header>}
        {id === "general" && section === id && props.project && <ProjectSettings key={props.project.id} project={props.project}
          workspaceId={props.workspaceId} offline={props.offline} canManage={props.canManageProject}
          onUpdated={props.onProjectUpdated} onToggle={props.onToggleProject} />}
        {id === "environments" && section === id && props.project && <EnvironmentSettings key={props.project.id} environments={props.environments} projectId={props.project.id} projectName={props.project.name} offline={props.offline} onSaved={props.onEnvironmentSaved} onToggle={props.onToggleEnvironment} />}
        {id === "exchange" && section === id && props.project && <div className={css.exchange}>{props.exchange}</div>}
        {id === "appearance" && <AppearanceSettings />}
        {id === "notifications" && section === id && props.notifications}
        {id === "security" && section === id && <SecuritySettings />}
        {id === "account" && <AccountSettings />}
        {id === "plugins" && section === id && props.plugins}
      </section>)}
    </div>
  </div>;
}
