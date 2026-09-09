import { Archive, ListChecks, Plus } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { RunListTabs } from "../navigator/tabs/RunListTabs";
import css from "./run-list-empty.module.css";

export function RunListEmpty({ mode, activeCount, archivedCount, onModeChange, onCreate }: {
  mode: "active" | "archived";
  activeCount: number;
  archivedCount: number;
  onModeChange: (mode: "active" | "archived") => void;
  onCreate: () => void;
}) {
  const { locale, t } = useTmsLocale();
  const archived = mode === "archived";
  const ru = locale === "ru";
  return <section className={css.page} data-testid="run-list-empty">
    <header className={css.header}>
      <h1>{ru ? "Тест-раны" : "Test runs"}</h1>
      <RunListTabs mode={mode} activeCount={activeCount} archivedCount={archivedCount} onChange={onModeChange} />
    </header>
    <div className={css.body}>
      <div className={css.message}>
        {archived ? <Archive className={css.symbol} size={36} strokeWidth={1.25} aria-hidden="true" />
          : <ListChecks className={css.symbol} size={36} strokeWidth={1.25} aria-hidden="true" />}
        <h2>{archived ? t("runs.noArchived") : t("runs.noActive")}</h2>
        <p>{archived ? t("runs.noArchivedHint") : t("runs.noActiveHint")}</p>
        {!archived && <button className={css.create} type="button" onClick={onCreate} data-testid="new-run">
          <Plus size={16} aria-hidden="true" />{ru ? "Создать тест-ран" : "Create test run"}
        </button>}
      </div>
    </div>
  </section>;
}
