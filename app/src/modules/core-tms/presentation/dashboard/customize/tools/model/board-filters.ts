"use client";

import { defaultPreferences } from "../../../../../dashboards/layout/preferences/preferences";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import type { DashboardModel } from "../../model/useDashboardModel";

export type BoardFilterKey = "period" | "environment" | "build";

export type BoardFilter = {
  key: BoardFilterKey;
  label: string;
  options: readonly { value: string; label: string }[];
  value: string;
  defaultValue: string;
  allowExact?: boolean;
};

export const MAX_EXACT_BUILD_LENGTH = 500;

const periods = ["7d", "30d", "90d"] as const;

export function useBoardFilters({ preferences, workbench }: DashboardModel) {
  const { t } = useTmsLocale();
  const { period, environmentId, buildReference } = preferences.value;
  const choices = workbench.snapshot?.choices;
  const environments = choices?.environments ?? [];
  const builds = choices?.builds ?? [];
  const filters: BoardFilter[] = [{
    key: "period",
    label: t("dashboard.period"),
    value: period,
    defaultValue: defaultPreferences.period,
    options: periods.map(value => ({ value, label: t(`dashboard.period.${value}`) })),
  }];

  if (workbench.enabled) {
    filters.push({
      key: "environment",
      label: t("dashboardWorkbench.environment"),
      value: environmentId,
      defaultValue: defaultPreferences.environmentId,
      options: [
        { value: "", label: t("dashboardWorkbench.allEnvironments") },
        ...(environmentId && !environments.some(item => item.id === environmentId)
          ? [{ value: environmentId, label: t("dashboardWorkbench.selectedEnvironment") }] : []),
        ...environments.map(({ id, projectName, name }) => ({ value: id, label: `${projectName} · ${name}` })),
      ],
    }, {
      key: "build",
      label: t("dashboardWorkbench.build"),
      value: buildReference,
      defaultValue: defaultPreferences.buildReference,
      options: [
        { value: "", label: t("dashboardWorkbench.allBuilds") },
        ...(buildReference && !builds.includes(buildReference) ? [{ value: buildReference, label: buildReference }] : []),
        ...builds.map(build => ({ value: build, label: build })),
      ],
      allowExact: choices?.buildsTruncated,
    });
  }

  const setFilter = (key: BoardFilterKey, value: string) => {
    const filter = filters.find(item => item.key === key);
    const next = key === "build" ? value.trim() : value;
    if (!filter || filter.value === next) return;
    const available = filter.options.some(option => option.value === next);
    if (!available && !(filter.allowExact && next.length <= MAX_EXACT_BUILD_LENGTH)) return;
    switch (key) {
      case "period": {
        const nextPeriod = periods.find(item => item === next);
        if (nextPeriod) preferences.update({ period: nextPeriod });
        break;
      }
      case "environment": preferences.update({ environmentId: next }); break;
      case "build": preferences.update({ buildReference: next }); break;
    }
  };

  return { filters, setFilter };
}
