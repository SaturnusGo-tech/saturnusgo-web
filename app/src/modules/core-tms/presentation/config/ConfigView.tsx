import { Boxes, FileJson, FolderCog, Palette, UserRound } from "lucide-react";
import { useState } from "react";
import type { Environment, Project } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { AppearanceSettings } from "./settings/AppearanceSettings";
import { AccountSettings } from "./settings/AccountSettings";
import { ProjectCaseExchange } from "./ProjectCaseExchange";
import { ProjectSettings } from "./sections/ProjectSettings";
import { EnvironmentSettings } from "./sections/EnvironmentSettings";
import { settingsCopy, settingsSections, type SettingsSection } from "./navigation/settings-sections";
import css from "./config.module.css";

type ConfigViewProps = {
  environments: Environment[]; project?: Project;
  onCreate: () => void; onEditEnvironment: (id: string) => void;
  onToggleEnvironment: (id: string) => void; onEditProject: () => void;
  onToggleProject: () => void; exchangeEnabled: boolean; onCasesImported: () => Promise<unknown>;
};
const icons = { general: FolderCog, environments: Boxes, exchange: FileJson, appearance: Palette, account: UserRound };
export function ConfigView(props: ConfigViewProps) {
  const { locale } = useTmsLocale();
  const copy = settingsCopy[locale];
  const [section, setSection] = useState<SettingsSection>("general");
  return <div className={css.page} data-testid="config-view">
    <aside className={css.sidebar}>
      <h1>{copy.title}</h1>
      <nav aria-label={copy.title}>
        <div className={css.navLabel}>{copy.projectGroup}<span title={props.project?.name}>{props.project?.name}</span></div>
        {settingsSections.map((id) => {
          const Icon = icons[id];
          return <div key={id}>
            {id === "appearance" && <div className={css.navLabel}>{copy.personalGroup}</div>}
            <button type="button" aria-current={section === id ? "page" : undefined} aria-controls={`settings-${id}`}
              onClick={() => setSection(id)}><Icon size={16} aria-hidden="true" />{copy[id][0]}</button>
          </div>;
        })}
      </nav>
    </aside>
    <div className={css.content}>
      {settingsSections.map((id) => <section key={id} id={`settings-${id}`} hidden={section !== id} aria-labelledby={`settings-${id}-title`} className={css.panel}>
        <header className={css.header}><span>{id === "appearance" || id === "account" ? copy.personalGroup : props.project?.name}</span>
          <h2 id={`settings-${id}-title`}>{copy[id][0]}</h2><p>{copy[id][1]}</p></header>
        {id === "general" && props.project && <ProjectSettings project={props.project} onEdit={props.onEditProject} onToggle={props.onToggleProject} />}
        {id === "environments" && <EnvironmentSettings environments={props.environments} onCreate={props.onCreate} onEdit={props.onEditEnvironment} onToggle={props.onToggleEnvironment} />}
        {id === "exchange" && props.project && <ProjectCaseExchange enabled={props.exchangeEnabled} project={props.project} onImported={props.onCasesImported} />}
        {id === "appearance" && <AppearanceSettings />}
        {id === "account" && <AccountSettings />}
      </section>)}
    </div>
  </div>;
}
