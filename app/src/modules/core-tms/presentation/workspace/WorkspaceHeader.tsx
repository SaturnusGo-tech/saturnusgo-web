import {
  CalendarDays,
  ChevronDown,
  Menu,
  Plus,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";
import { TmsSessionControl } from "../../auth/presentation/session/TmsSessionControl";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { TmsLocale } from "../../localization/model/locale";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import styles from "../../tms.module.css";

export function WorkspaceHeader({ model }: { model: WorkspaceModel }) {
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
  const connectionLabel =
    model.connection === "connected"
      ? t("header.apiConnected")
      : model.connection === "demo"
        ? t("header.developmentDemo")
        : t("header.apiUnavailable");
  const languages: Array<{ id: TmsLocale; short: string }> = [
    { id: "en", short: "EN" },
    { id: "ru", short: "RU" },
  ];
  return (
    <header className={styles.tabsBar}>
      <button
        className={styles.homeButton}
        onClick={() => model.setView("dashboard")}
        aria-label={t("header.openDashboard")}
        title={t("header.dashboard")}
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
            onClick={() => model.setDialog("project")}
          >
            <Plus size={15} /> {t("header.createFirstProject")}
          </button>
        )}
        {model.project && workspaceReady && (
          <button
            className={styles.headerProjectAdd}
            onClick={() => model.setDialog("project")}
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
        <div
          className={styles.connection}
          role="status"
          aria-label={connectionLabel}
          title={connectionLabel}
        >
          {model.connection === "connected" ? (
            <Wifi size={15} />
          ) : (
            <WifiOff size={15} />
          )}
        </div>
        <TmsSessionControl />
      </div>
    </header>
  );
}
