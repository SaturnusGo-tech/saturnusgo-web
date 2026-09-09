"use client";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { DashboardPeriod } from "../../../dashboards/model/dashboard-analytics";
import type { DashboardLayoutModel } from "../../../dashboards/layout/application/useDashboardLayout";
import type { DashboardViewProps } from "../dashboard-view";
import { widgetKey } from "../../../dashboards/layout/model/widget-catalog";
import { WorkbenchContextBar } from "../workbench/controls/WorkbenchContextBar";
import { WidgetGrid } from "./grid/WidgetGrid";
import type { DashboardModel } from "./model/useDashboardModel";
import { WidgetRenderer } from "./render/WidgetRenderer";
import { SectionNavigation } from "./navigation/SectionNavigation";
import { dashboardSections, widgetSection, sectionMoveTarget, sectionLabels } from "../../../dashboards/layout/sections/widget-sections";
import surface from "../dashboard.module.css";
import styles from "./layout.module.css";

export function DashboardContent({ onOpenRow, layout, model }: DashboardViewProps & { layout: DashboardLayoutModel; model: DashboardModel }) {
  const { languageTag, t, locale } = useTmsLocale();
  const { analytics, workbench, snapshot, preferences } = model;
  const { period, filtersOpen } = preferences.value;
  const updatedAt = snapshot ? new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(snapshot.generatedAt)) : null;
  const reduced = useReducedMotion();
  const widgets = (layout.draft ?? layout.board)?.widgets ?? [];
  const editing = Boolean(layout.draft);
  const sections = dashboardSections.filter(section => widgets.some(widget => widgetSection(widgetKey(widget)) === section));
  const selected = sections.length === 1 ? sections[0] : preferences.value.section === "all" || sections.includes(preferences.value.section)
    ? preferences.value.section : sections[0] ?? "overview";
  return <>
    <div className={styles.toolbar}>
    <SectionNavigation sections={sections} selected={selected} onSelect={section => preferences.update({ section })} />
    <div className={styles.context}>
      <button type="button" className={styles.quiet} aria-expanded={filtersOpen} onClick={() => preferences.update({ filtersOpen: !filtersOpen })}>{t("dashboardWorkbench.context")}</button>
      <AnimatedSelect compact className={styles.period} label={t("dashboard.period")} value={period} onChange={(value) => preferences.update({ period: value as DashboardPeriod })}
        options={[{value:"7d",label:t("dashboard.period7")},{value:"30d",label:t("dashboard.period30")},{value:"90d",label:t("dashboard.period90")}]} />
      <button type="button" className={surface.refreshButton} aria-label={t("dashboard.refresh")}
        onClick={() => { analytics.refresh(); workbench.refresh(); }}><RefreshCw size={15} /></button></div></div>
    <AnimatePresence initial={false}>{filtersOpen && <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:reduced ? 0 : .2}} style={{position:"relative",zIndex:30,overflow:"visible",display:"flow-root"}}><WorkbenchContextBar model={workbench} /></motion.div>}</AnimatePresence>
    {analytics.summaryError && <p className={surface.syncError} role="alert">{t(snapshot ? "dashboard.staleAnalytics" : "dashboard.summaryError")}
      <button onClick={analytics.refresh}>{t("dashboard.retry")}</button></p>}
    {!preferences.stored && <p className={surface.syncError}>{locale === "ru" ? "Браузер не разрешил сохранить контекст. В этой сессии настройки продолжат работать." : "The browser could not save your context. Settings still work in this session."}</p>}
    <div className={styles.sections}>
      {sections.filter(section => selected === "all" || section === selected).map(section => <section key={section} className={styles.dashboardSection} data-dashboard-section={section}>
        <div className={styles.sectionHeading}><div><h2>{sectionLabels[section][locale === "ru" ? "ru" : "en"]}</h2>
          <p>{sectionLabels[section][locale === "ru" ? "hintRu" : "hintEn"]}</p></div>
          <span>{widgets.filter(widget => widgetSection(widgetKey(widget)) === section).length}</span></div>
        <WidgetGrid widgets={widgets.filter(widget => widgetSection(widgetKey(widget)) === section)} editing={editing}
          disabled={layout.saving || layout.retryPending || layout.failure === "conflict"}
          onMove={(id, index) => { const to = sectionMoveTarget(widgets, section, index); if (to >= 0) layout.controller.move(id, to); }}
          onRemove={layout.controller.remove} onResize={layout.controller.resize}
          render={(widget, title) => <WidgetRenderer widget={widgetKey(widget)} title={title} model={model} onOpenRow={onOpenRow} />} />
      </section>)}
    </div>
    {updatedAt && <p className={surface.updatedAt}>{t("dashboard.historicalUpdated", { date: updatedAt })}</p>}

  </>;
}
