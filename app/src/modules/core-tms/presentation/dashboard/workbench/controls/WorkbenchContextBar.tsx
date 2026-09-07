"use client";

import { useId, useState } from "react";
import type { DashboardWorkbenchModel } from "../../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "../workbench.module.css";

export function WorkbenchContextBar({ model }: { model: DashboardWorkbenchModel }) {
  const { t } = useTmsLocale();
  const buildListId = useId();
  const current = JSON.stringify([model.scopeKey, model.filters]);
  const [draft, setDraft] = useState({ owner: current, ...model.filters });
  const filters = draft.owner === current ? draft : model.filters;
  const choices = model.snapshot?.choices;
  const changed = filters.environmentId !== model.filters.environmentId ||
    filters.buildReference.trim() !== model.filters.buildReference;
  const update = (field: "environmentId" | "buildReference", value: string) =>
    setDraft({ owner: current, ...filters, [field]: value });
  const reset = () => {
    setDraft({ owner: current, environmentId: "", buildReference: "" });
    model.setFilters({ environmentId: "", buildReference: "" });
  };

  return <section className={styles.contextBar} aria-label={t("dashboardWorkbench.context")}>
    <div className={styles.contextHeading}><strong>{t("dashboardWorkbench.context")}</strong>
      <p>{t("dashboardWorkbench.contextHint")}</p></div>
    <form className={styles.filters} onSubmit={(event) => {
      event.preventDefault();
      model.setFilters({ environmentId: filters.environmentId, buildReference: filters.buildReference.trim() });
    }}>
      <label><span>{t("dashboardWorkbench.environment")}</span>
        <select value={filters.environmentId} disabled={!model.enabled}
          onChange={(event) => update("environmentId", event.target.value)}>
          <option value="">{t("dashboardWorkbench.allEnvironments")}</option>
          {filters.environmentId && !choices?.environments.some((item) => item.id === filters.environmentId) &&
            <option value={filters.environmentId}>{t("dashboardWorkbench.selectedEnvironment")}</option>}
          {choices?.environments.map((item) => <option key={`${item.projectId}:${item.id}`} value={item.id}>
            {item.projectName} · {item.name}
          </option>)}
        </select>
      </label>
      <label><span>{t("dashboardWorkbench.build")}</span>
        <input list={buildListId} value={filters.buildReference} disabled={!model.enabled} maxLength={500}
          placeholder={t("dashboardWorkbench.allBuilds")} title={t("dashboardWorkbench.exactBuild")}
          onChange={(event) => update("buildReference", event.target.value)} />
        <datalist id={buildListId}>{choices?.builds.map((build) => <option key={build} value={build} />)}</datalist>
      </label>
      <button type="submit" disabled={!model.enabled || !changed}>{t("dashboardWorkbench.apply")}</button>
      {(model.filters.environmentId || model.filters.buildReference || changed) &&
        <button type="button" className={styles.quietButton} onClick={reset}>{t("dashboardWorkbench.reset")}</button>}
    </form>
    {(choices?.environmentsTruncated || choices?.buildsTruncated) &&
      <p className={styles.choiceNote}>{t("dashboardWorkbench.choicesLimited")}</p>}
  </section>;
}
