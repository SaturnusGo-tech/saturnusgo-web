"use client";

import { useState } from "react";
import type { DashboardWorkbenchModel } from "../../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { AnimatedSelect } from "../../../common/select/AnimatedSelect";
import styles from "../workbench.module.css";

export function WorkbenchContextBar({ model }: { model: DashboardWorkbenchModel }) {
  const { t } = useTmsLocale();
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
      <div className={styles.filterField}><span>{t("dashboardWorkbench.environment")}</span>
        <AnimatedSelect compact className={styles.filterSelect} label={t("dashboardWorkbench.environment")}
          value={filters.environmentId} disabled={!model.enabled} onChange={(value) => update("environmentId", value)}
          options={[
            { value: "", label: t("dashboardWorkbench.allEnvironments") },
            ...(filters.environmentId && !choices?.environments.some((item) => item.id === filters.environmentId)
              ? [{ value: filters.environmentId, label: t("dashboardWorkbench.selectedEnvironment") }] : []),
            ...(choices?.environments.map((item) => ({ value: item.id, label: `${item.projectName} · ${item.name}` })) ?? []),
          ]} />
      </div>
      <div className={styles.filterField}><span>{t("dashboardWorkbench.build")}</span>
        <AnimatedSelect compact className={styles.filterSelect} label={t("dashboardWorkbench.build")}
          value={filters.buildReference} disabled={!model.enabled} onChange={(value) => update("buildReference", value)}
          options={[
            { value: "", label: t("dashboardWorkbench.allBuilds") },
            ...(filters.buildReference && !choices?.builds.includes(filters.buildReference)
              ? [{ value: filters.buildReference, label: filters.buildReference }] : []),
            ...(choices?.builds.map((build) => ({ value: build, label: build })) ?? []),
          ]} />
        {choices?.buildsTruncated && <input value={filters.buildReference} disabled={!model.enabled} maxLength={500}
          aria-label={t("dashboardWorkbench.exactBuild")} placeholder={t("dashboardWorkbench.exactBuild")}
          onChange={(event) => update("buildReference", event.target.value)} />}
      </div>
      <button type="submit" disabled={!model.enabled || !changed}>{t("dashboardWorkbench.apply")}</button>
      {(model.filters.environmentId || model.filters.buildReference || changed) &&
        <button type="button" className={styles.quietButton} onClick={reset}>{t("dashboardWorkbench.reset")}</button>}
    </form>
    {(choices?.environmentsTruncated || choices?.buildsTruncated) &&
      <p className={styles.choiceNote}>{t("dashboardWorkbench.choicesLimited")}</p>}
  </section>;
}
