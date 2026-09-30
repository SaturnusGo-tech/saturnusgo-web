import { Bell, Boxes, FileJson, FolderCog, Palette, UserRound } from "lucide-react";
import { transitionContent } from "../workspace/motion/transition/content-transition";
import type { ReactNode } from "react";
import type { Environment, Project } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { AppearanceSettings } from "./settings/AppearanceSettings";
import { AccountSettings } from "./settings/AccountSettings";
import { ProjectSettings } from "./sections/ProjectSettings";
import { EnvironmentSettings } from "./sections/EnvironmentSettings";
import { settingsCopy, settingsSections } from "./navigation/settings-sections";
import { useSettingsSection } from "./navigation/state/useSettingsSection";
import css from "./config.module.css";

type ConfigViewProps = {
  environments: Environment[]; project?: Project; notifications?: ReactNode;
  offline: boolean; onEnvironmentSaved: (environment: Environment) => void;
  onToggleEnvironment: (id: string) => void; onEditProject: () => void;
  onToggleProject: () => void; exchange: ReactNode;
};
const icons = { general: FolderCog, environments: Boxes, exchange: FileJson, appearance: Palette, notifications: Bell, account: UserRound };
export function ConfigView(props: ConfigViewProps) {
  const { locale } = useTmsLocale();
  const copy = settingsCopy[locale];
  const { section, select } = useSettingsSection(Boolean(props.project));
  const available = props.project ? settingsSections : settingsSections.filter(id => ["appearance", "notifications", "account"].includes(id));
  if (section === "exchange" && props.project) return <>{props.exchange}</>;
  return <div className={css.page} data-testid="config-view">
    <aside className={css.sidebar}>
      <h1>{copy.title}</h1>
      <nav aria-label={copy.title}>
        {props.project && <div className={css.navLabel}>{copy.projectGroup}<span title={props.project.name}>{props.project.name}</span></div>}
        {available.map((id) => {
          const Icon = icons[id];
          return <div key={id}>
            {id === "appearance" && <div className={css.navLabel}>{copy.personalGroup}</div>}
            <button type="button" aria-current={section === id ? "page" : undefined} aria-controls={`settings-${id}`}
              onClick={() => transitionContent(() => select(id))}><Icon size={16} aria-hidden="true" />{copy[id][0]}</button>
          </div>;
        })}
      </nav>
    </aside>
    <div className={css.content}>
      {available.map((id) => <section key={id} id={`settings-${id}`} hidden={section !== id} aria-labelledby={`settings-${id}-title`} className={css.panel} data-layout={id === "general" || id === "exchange" ? "rows" : undefined}>
        {id !== "environments" && <header className={css.header}>
          <h2 id={`settings-${id}-title`}>{copy[id][0]}</h2><p>{copy[id][1]}</p></header>}
        {id === "general" && props.project && <ProjectSettings project={props.project} onEdit={props.onEditProject} onToggle={props.onToggleProject} />}
        {id === "environments" && section === id && props.project && <EnvironmentSettings key={props.project.id} environments={props.environments} projectId={props.project.id} projectName={props.project.name} offline={props.offline} onSaved={props.onEnvironmentSaved} onToggle={props.onToggleEnvironment} />}
        {id === "appearance" && <AppearanceSettings />}
        {id === "notifications" && section === id && props.notifications}
        {id === "account" && <AccountSettings />}
      </section>)}
    </div>
  </div>;
}
