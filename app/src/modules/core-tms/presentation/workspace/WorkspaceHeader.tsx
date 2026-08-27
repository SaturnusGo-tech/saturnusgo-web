import {
  CalendarDays,
  ChevronDown,
  Menu,
  Plus,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { WorkspaceModel } from "../../state/model/useWorkspaceModel";
import styles from "../../tms.module.css";

export function WorkspaceHeader({ model }: { model: WorkspaceModel }) {
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
  const today = now.toISOString().slice(0, 10);
  const localTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
  return (
    <header className={styles.tabsBar}>
      <button
        className={styles.homeButton}
        onClick={() => model.setView("dashboard")}
        aria-label="Open dashboard"
        title="Dashboard"
      >
        <Menu size={21} />
      </button>
      <button
        className={styles.brandButton}
        onClick={() => model.setView("dashboard")}
        aria-label="TMS dashboard"
      >
        <span className={styles.brandGlyph}>T</span>
        <strong>TMS</strong>
      </button>
      <div className={styles.headerProject}>
        <span>Project</span>
        {model.project ? (
          <label className={styles.headerProjectSelect}>
            <select
              value={model.project.id}
              onChange={(event) => model.chooseProject(event.target.value)}
              aria-label="Current project"
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
            <Plus size={15} /> Create first project
          </button>
        )}
        {model.project && workspaceReady && (
          <button
            className={styles.headerProjectAdd}
            onClick={() => model.setDialog("project")}
            aria-label="Create project"
            title="Create project"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      <label className={styles.commandSearch}>
        <Search size={17} />
        <input
          id="tms-command-search"
          aria-label="Search test cases"
          disabled={!model.project}
          value={model.query}
          onChange={(event) => model.setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") model.setView("cases");
          }}
          placeholder={
            model.project ? "Search test cases…" : "Create a project to begin"
          }
        />
        <kbd>⌘ K</kbd>
      </label>
      <div className={styles.headerMeta}>
        <div className={styles.headerMetaItem}>
          <span>Environment</span>
          <strong>{activeEnvironment}</strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>Build</span>
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
          className={styles.connection}
          role="status"
          aria-label={
            model.connection === "connected"
              ? "TMS API connected"
              : model.connection === "demo"
                ? "Development demo"
                : "TMS API unavailable"
          }
          title={
            model.connection === "connected"
              ? "TMS API connected"
              : model.connection === "demo"
                ? "Development demo"
                : "TMS API unavailable"
          }
        >
          {model.connection === "connected" ? (
            <Wifi size={15} />
          ) : (
            <WifiOff size={15} />
          )}
        </div>
        <span className={styles.avatar}>QA</span>
      </div>
    </header>
  );
}
