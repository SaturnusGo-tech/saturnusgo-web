"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";
import type { DashboardWorkbenchModel } from "../../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { DashboardSelect } from "../../common/select/DashboardSelect";
import styles from "./contextBar.module.css";

const ALL = "all-context-values";

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

  return <form className={styles.form} aria-label={t("dashboardWorkbench.context")} onSubmit={(event) => {
    event.preventDefault();
    model.setFilters({ environmentId: filters.environmentId, buildReference: filters.buildReference.trim() });
  }}>
    {model.enabled && <>
    <div className={styles.field}><span>{t("dashboardWorkbench.environment")}</span>
      <DashboardSelect className={styles.select} label={t("dashboardWorkbench.environment")}
        value={filters.environmentId ? `:${filters.environmentId}` : ALL} isDisabled={!model.enabled} onChange={(value) => update("environmentId", value === ALL ? "" : value.slice(1))}
        options={[
          { value: ALL, label: t("dashboardWorkbench.allEnvironments") },
          ...(filters.environmentId && !choices?.environments.some((item) => item.id === filters.environmentId)
            ? [{ value: `:${filters.environmentId}`, label: t("dashboardWorkbench.selectedEnvironment") }] : []),
          ...(choices?.environments.map((item) => ({ value: `:${item.id}`, label: `${item.projectName} · ${item.name}` })) ?? []),
        ]} />
    </div>
    <div className={styles.field}><span>{t("dashboardWorkbench.build")}</span>
      <DashboardSelect className={styles.select} label={t("dashboardWorkbench.build")}
        value={filters.buildReference ? `:${filters.buildReference}` : ALL} isDisabled={!model.enabled} onChange={(value) => update("buildReference", value === ALL ? "" : value.slice(1))}
        options={[
          { value: ALL, label: t("dashboardWorkbench.allBuilds") },
          ...(filters.buildReference && !choices?.builds.includes(filters.buildReference)
            ? [{ value: `:${filters.buildReference}`, label: filters.buildReference }] : []),
          ...(choices?.builds.map((build) => ({ value: `:${build}`, label: build })) ?? []),
        ]} />
    </div>
    {choices?.buildsTruncated && <div className={styles.field}><span>{t("dashboardWorkbench.exactBuild")}</span>
      <Input size="sm" variant="flat" value={filters.buildReference} isDisabled={!model.enabled} maxLength={500}
        classNames={{ base: styles.select, inputWrapper: styles.input, input: styles.inputText }}
        aria-label={t("dashboardWorkbench.exactBuild")} placeholder={t("dashboardWorkbench.exactBuild")}
        onValueChange={(value) => update("buildReference", value)} />
    </div>}
    <div className={styles.actions}>
      <Button type="submit" size="sm" variant="flat" disableRipple className={styles.apply}
        isDisabled={!model.enabled || !changed}>{t("dashboardWorkbench.apply")}</Button>
      {(model.filters.environmentId || model.filters.buildReference || changed) &&
        <Button type="button" size="sm" variant="light" disableRipple className={styles.reset} onPress={reset}>{t("dashboardWorkbench.reset")}</Button>}
    </div>
    </>}
    {(choices?.environmentsTruncated || choices?.buildsTruncated) &&
      <p className={styles.note}>{t("dashboardWorkbench.choicesLimited")}</p>}
  </form>;
}
