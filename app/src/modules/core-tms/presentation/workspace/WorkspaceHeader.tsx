import {
  CalendarDays,
  ChevronDown,
  Menu,
  Plus,
  Search,
} from "lucide-react";
import { TmsSessionControl } from "../../auth/presentation/session/TmsSessionControl";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { TmsLocale } from "../../localization/model/locale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import styles from "../../tms.module.css";

export function WorkspaceHeader({
  model,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  model: WorkspaceModel;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { languageTag, locale, setLocale, t } = useTmsLocale();
  const workspaceReady =
    model.connection === "connected" || model.connection === "demo";
  const activeEnvironment =
    model.selectedRun?.environment.name ??
    model.projectEnvironments.find((item) => item.isDefault)?.name ??
    model.projectEnvironments[0]?.name ??
    "—";
  const activeBuild =
    model.selectedRun?.build ?? (model.project ? "local-current" : "—");
  const now = new Date();
  const today = now.toLocaleDateString(languageTag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const localTime = now.toLocaleTimeString(languageTag, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const weekday = now.toLocaleDateString(languageTag, { weekday: "short" });
  const languages: Array<{ id: TmsLocale; short: string }> = [
    { id: "en", short: "EN" },
    { id: "ru", short: "RU" },
  ];
  return (
    <header className={styles.tabsBar}>
      <button
        className={styles.homeButton}
        onClick={onToggleSidebar}
        aria-label={t("header.toggleNavigation")}
        title={t("header.toggleNavigation")}
        aria-controls="tms-navigation"
        aria-expanded={!sidebarCollapsed}
      >
        <Menu size={21} />
      </button>
      <button
        className={styles.brandButton}
        onClick={() => model.setView("dashboard")}
        aria-label={t("header.dashboardAria")}
      >
        <strong>TMS</strong>
      </button>
      <div className={styles.headerProject}>
        <span>{t("header.project")}</span>
        {model.project ? (
          <label className={styles.headerProjectSelect}>
            <select
              value={model.project.id}
              title={model.project.name}
              onChange={(event) => model.chooseProject(event.target.value)}
              aria-label={t("header.currentProject")}
            >
              {model.projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </label>
        ) : (
          <button
            className={styles.headerProjectEmpty}
            disabled={!workspaceReady}
            onClick={model.openNewProject}
          >
            <Plus size={15} /> {t("header.createFirstProject")}
          </button>
        )}
        {model.project && workspaceReady && (
          <button
            className={styles.headerProjectAdd}
            onClick={model.openNewProject}
            aria-label={t("header.createProject")}
            title={t("header.createProject")}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      <label className={styles.commandSearch}>
        <Search size={17} />
        <input
          id="tms-command-search"
          aria-label={t("header.searchCases")}
          disabled={!model.project}
          value={model.query}
          onChange={(event) => model.setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") model.setView("cases");
          }}
          placeholder={
            model.project
              ? t("header.searchPlaceholder")
              : t("header.createProjectToBegin")
          }
        />
        <kbd>⌘ K</kbd>
      </label>
      <div className={styles.headerMeta}>
        <div className={styles.headerMetaItem}>
          <span>{t("header.environment")}</span>
          <strong>{activeEnvironment}</strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>{t("header.build")}</span>
          <strong>{activeBuild}</strong>
        </div>
        <div className={styles.headerClock}>
          <CalendarDays size={17} />
          <span>
            <strong>{today}</strong>
            <small>
              {weekday} {localTime}
            </small>
          </span>
        </div>
        <div
          className={styles.languageSwitcher}
          role="group"
          aria-label={t("language.label")}
        >
          {languages.map((language) => {
            const name = t(
              language.id === "en" ? "language.english" : "language.russian",
            );
            const label = t("language.switchTo", { language: name });
            return (
              <button
                key={language.id}
                type="button"
                className={styles.languageOption}
                aria-label={label}
                aria-pressed={locale === language.id}
                title={label}
                onClick={() => setLocale(language.id)}
              >
                {language.short}
              </button>
            );
          })}
        </div>
        <TmsSessionControl />
      </div>
    </header>
  );
}
