"use client";
import { ErrorToast } from "../../common/error/ErrorToast";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { WorkspaceHeaderActions } from "../../workspace/header-actions/WorkspaceHeaderActions";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useId, useLayoutEffect, useRef } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { DashboardLayoutModel } from "../../../dashboards/layout/application/useDashboardLayout";
import type { DashboardViewProps } from "../dashboard-view";
import { dashboardcnEnabled, widgetKey } from "../../../dashboards/layout/model/widget-catalog";
import { WorkbenchContextBar } from "../workbench/controls/WorkbenchContextBar";
import { WidgetGrid } from "./grid/WidgetGrid";
import type { DashboardModel } from "./model/useDashboardModel";
import { WidgetRenderer } from "./render/WidgetRenderer";
import { SectionNavigation } from "./navigation/SectionNavigation";
import { dashboardTabId } from "../common/segments/DashboardSegments";
import { DashboardBoardTools } from "./tools/DashboardBoardTools";
import { dashboardSections, widgetSection, sectionMoveTarget, sectionLabels } from "../../../dashboards/layout/sections/widget-sections";
import surface from "../dashboard.module.css";
import styles from "./layout.module.css";

export function DashboardContent({ onOpenRow, data, layout, model, projectName }: DashboardViewProps & {
  layout: DashboardLayoutModel; model: DashboardModel; projectName: string;
}) {
  const { languageTag, t, locale } = useTmsLocale();
  const { analytics, workbench, snapshot, preferences } = model;
  const { period, filtersOpen } = preferences.value;
  const updatedAt = snapshot ? new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(snapshot.generatedAt)) : null;
  const reduced = useReducedMotion();
  const panelId = useId();
  const contextId = useId();
  const workflow = dashboardcnEnabled();
  const widgets = (layout.draft ?? layout.board)?.widgets ?? [];
  const editing = Boolean(layout.draft);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const sections = dashboardSections.filter(section => widgets.some(widget => widgetSection(widgetKey(widget)) === section));
  const selected = sections.length === 1 ? sections[0] : preferences.value.section === "all" || sections.includes(preferences.value.section)
    ? preferences.value.section : sections[0] ?? "overview";
  const renderedSections = selected === "all"
    ? [...sections.filter(section => section !== "overview"), ...sections.filter(section => section === "overview")]
    : sections;
  const previousView = useRef({ selected, editing });
  useLayoutEffect(() => {
    const sectionChanged = previousView.current.selected !== selected;
    const editModeChanged = previousView.current.editing !== editing;
    previousView.current = { selected, editing };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || (!sectionChanged && !editModeChanged)) return;
    const animation = sectionsRef.current?.animate?.(sectionChanged
      ? [{ opacity: .3, translate: "0 5px" }, { opacity: 1, translate: "0 0" }]
      : [{ opacity: .85 }, { opacity: 1 }],
    { duration: sectionChanged ? 230 : 180, easing: "cubic-bezier(.22,.68,.25,1)" });
    return () => animation?.cancel();
  }, [editing, selected]);
  return <>
    {workflow ? <div className={styles.boardNavigation}>
      <SectionNavigation sections={sections} selected={selected} panelId={panelId} onSelect={section => preferences.update({ section })} />
    </div> : <div className={styles.toolbar}>
    <SectionNavigation sections={sections} selected={selected} onSelect={section => preferences.update({ section })} />
    <div className={styles.context}>
      <button type="button" className={styles.quiet} aria-expanded={filtersOpen} aria-controls={contextId} onClick={() => preferences.update({ filtersOpen: !filtersOpen })}>{t("dashboardWorkbench.context")}</button>
      <AnimatedSelect compact className={styles.period} label={t("dashboard.period")} value={period} onChange={(value) => preferences.update({ period: value as typeof period })}
        options={[{value:"7d",label:t("dashboard.period7")},{value:"30d",label:t("dashboard.period30")},{value:"90d",label:t("dashboard.period90")}]} />
      <button type="button" className={surface.refreshButton} aria-label={t("dashboard.refresh")}
        onClick={() => { analytics.refresh(); workbench.refresh(); void preferences.refresh(); }}><RefreshCw size={15} /></button></div></div>}
    {workflow ? <WorkspaceHeaderActions><DashboardBoardTools model={model} /></WorkspaceHeaderActions> : <div id={contextId} className={styles.contextDisclosure}>
      <AnimatePresence initial={false}>{filtersOpen &&
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }}>
          <WorkbenchContextBar model={workbench} />
        </motion.div>}
      </AnimatePresence>
    </div>}
    <ErrorToast message={analytics.summaryError ? t(snapshot ? "dashboard.staleAnalytics" : "dashboard.summaryError") : null}
      retryLabel={t("dashboard.retry")} onRetry={analytics.refresh} />
    <ErrorToast message={!preferences.stored ? t("dashboardLayout.personalSyncError") : null}
      retryLabel={t("dashboardLayout.retry")} onRetry={() => void preferences.refresh()} />
    <div ref={sectionsRef} className={styles.sections} id={workflow ? panelId : undefined}
      role={workflow ? "tabpanel" : undefined} aria-labelledby={workflow ? dashboardTabId(panelId, selected) : undefined}>
      {renderedSections.filter(section => workflow || selected === "all" || section === selected).map(section =>
        <section key={section} className={styles.dashboardSection} data-dashboard-section={section}
          hidden={selected !== "all" && selected !== section}>
        {(!workflow || selected === "all") && <div className={styles.sectionHeading}><div><h2>{workflow && section === "overview" ? t("dashboardWorkbench.context") : sectionLabels[section][locale]}</h2>
          {!workflow && <p>{sectionLabels[section][locale === "ru" ? "hintRu" : "hintEn"]}</p>}</div>
          {!workflow && <span>{widgets.filter(widget => widgetSection(widgetKey(widget)) === section).length}</span>}</div>}
        <WidgetGrid widgets={widgets.filter(widget => widgetSection(widgetKey(widget)) === section)} editing={editing}
          disabled={layout.saving || layout.retryPending || layout.failure === "conflict"}
          onMove={(id, index) => { const to = sectionMoveTarget(widgets, section, index); if (to >= 0) layout.controller.move(id, to); }}
          onRemove={layout.controller.remove} onResize={layout.controller.resize}
          render={(widget, title) => <WidgetRenderer widget={widgetKey(widget)} title={title} model={model} projectName={projectName}
            onOpenRow={onOpenRow} canManageDefects={data.meta.authorization.capabilities.includes("defect:manage")} />} />
      </section>)}
    </div>
    {updatedAt && <p className={surface.updatedAt}>{t("dashboard.historicalUpdated", { date: updatedAt })}</p>}

  </>;
}
