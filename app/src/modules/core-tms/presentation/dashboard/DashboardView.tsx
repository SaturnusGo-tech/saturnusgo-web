"use client";
import { transitionContent } from "../workspace/motion/transition/content-transition";
import { useTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Plus, Pencil } from "lucide-react";
import { usePersonalDashboardLayout } from "../../dashboards/layout/personal/usePersonalDashboardLayout";
import { useDashboardLayout } from "../../dashboards/layout/application/useDashboardLayout";
import { createBoardWidget, widgetKey } from "../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useDashboardModel } from "./customize/model/useDashboardModel";
import { WidgetRenderer } from "./customize/render/WidgetRenderer";
import { DashboardContent } from "./customize/DashboardContent";
import { DashboardEmpty } from "./customize/empty/DashboardEmpty";
import { WidgetCatalog } from "./customize/catalog/WidgetCatalog";
import type { DashboardViewProps } from "./dashboard-view";
import { DashboardDetail } from "./detail/route/DashboardDetail";
import { useDrillNavigation } from "./navigation/useDrillNavigation";
import surface from "./dashboard.module.css";
import styles from "./customize/layout.module.css";
import shell from "../../tms.module.css";

export function DashboardView(props: DashboardViewProps) {
  const { subject } = useTmsSession();
  return <DashboardWorkspace key={JSON.stringify([subject, props.data.workspace.id, props.projectId])} {...props} />;
}
function DashboardWorkspace(props: DashboardViewProps) {
  const { data, projectId } = props; const { t, locale } = useTmsLocale();
  const sourceModel = useDashboardModel(props);
  const navigation = useDrillNavigation(sourceModel);
  const model = { ...sourceModel, analytics: { ...sourceModel.analytics, openDrill: navigation.openAnalytics, selectRelatedDrill: navigation.related },
    workbench: { ...sourceModel.workbench, openDrill: navigation.openWorkbench } };
  const teamLayout = useDashboardLayout({ workspaceId: data.workspace.id, projectId });
  const personalLayout = usePersonalDashboardLayout(teamLayout.board, props.serverAnalytics === true);
  const personalEditing = Boolean(personalLayout?.draft);
  const layout = teamLayout.draft ? teamLayout : personalLayout?.board ? personalLayout : teamLayout;
  const [catalogScope, setCatalogScope] = useState<string | null>(null);
  const scope = `${data.workspace.id}:${projectId}`;
  const board = layout.draft ?? layout.board; const editing = Boolean(layout.draft);
  const canEdit = data.meta.authorization.capabilities.includes("report:manage");
  const disabled = layout.saving || layout.retryPending;
  const currentProject = data.projects.find((project) => project.id === projectId)?.name ?? projectId;
  const edit = () => { teamLayout.controller.edit(t("dashboardLayout.defaultName")); };
  const openCatalog = () => transitionContent(() => {
    if (!editing) edit();
    setCatalogScope(scope);
  });
  const catalogOpen = Boolean(teamLayout.draft) && catalogScope === scope;
  const addButton = useRef<HTMLButtonElement>(null);
  const wasCatalogOpen = useRef(false);
  useEffect(() => { setCatalogScope(null); }, [scope]);
  useEffect(() => {
    if (!catalogOpen && wasCatalogOpen.current) addButton.current?.focus();
    wasCatalogOpen.current = catalogOpen;
  }, [catalogOpen]);
  if (model.analytics.drill.selected || model.workbench.drill) return <DashboardDetail {...props} model={model} onBack={navigation.close} />;
  if (catalogOpen) return <div key="catalog" className={`${shell.pageScroll} ${surface.page} ${styles.page}`} data-dashboard-workspace="true">
    <WidgetCatalog dashboardName={board!.name} projectName={currentProject}
      renderPreview={key => <WidgetRenderer widget={key} model={model} onOpenRow={props.onOpenRow} />} selected={new Set(board!.widgets.map(widgetKey))}
      onBack={() => transitionContent(() => setCatalogScope(null))}
      onAdd={(definitions) => layout.controller.add(definitions.map((definition) => createBoardWidget(definition, locale, crypto.randomUUID())))} />
  </div>;
  return <div key="dashboard" className={`${shell.pageScroll} ${surface.page} ${styles.page}`} data-dashboard-workspace="true">
    <header className={styles.header}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>{currentProject}<span> / </span>{t("dashboard.analyticsTitle")}</span>
        {teamLayout.draft ? <input data-inline-title className={styles.name} aria-label={t("dashboardLayout.name")} maxLength={200}
          value={layout.draft!.name} disabled={disabled || layout.failure === "conflict"} onChange={(event) => layout.controller.rename(event.target.value)} />
          : <h1>{board?.name ?? t("dashboard.analyticsTitle")}</h1>}
        {editing && <p>{t(personalEditing ? "dashboardLayout.personalEditHint" : "dashboardLayout.editHint")}</p>}
      </div>
      {!layout.loading && <div className={styles.actions}>
        {editing ? <>
          <button type="button" className={styles.quiet} disabled={disabled} onClick={() => { setCatalogScope(null); layout.controller.cancel(); }}>{t("dashboardLayout.cancel")}</button>
          {!personalEditing && <button type="button" ref={addButton} className={styles.secondary} disabled={disabled || layout.failure === "conflict"} onClick={openCatalog}><Plus size={15} />{t("dashboardLayout.add")}</button>}
          <button type="button" className={styles.primary} disabled={layout.saving || !layout.draft!.name.trim() || layout.failure === "conflict"}
            onClick={() => void layout.controller.save()}>{layout.saving && <LoaderCircle size={15} className={surface.spin} />}{t(layout.saving ? "dashboardLayout.saving" : layout.retryPending ? "dashboardLayout.retry" : "dashboardLayout.save")}</button>
        </> : <>
          {personalLayout?.board?.widgets.length ? <button type="button" className={styles.secondary}
            onClick={() => personalLayout.controller.edit(personalLayout.board!.name)}>{t("dashboardLayout.personalEdit")}</button> : null}
          {canEdit && board && <button type="button" className={styles.editButton} onClick={edit}
            aria-label={t("dashboardLayout.edit")} title={t("dashboardLayout.edit")}><Pencil size={15} />{t("dashboardLayout.edit")}</button>}
        </>}
      </div>}
    </header>
    {(layout.failure || personalLayout?.failure) && <div className={styles.failure} role="alert">
      <p>{!layout.failure ? t("dashboardLayout.personalSyncError") : t(!layout.board && !layout.draft && layout.failure === "unavailable" ? "dashboardLayout.loadError" : `dashboardLayout.${layout.failure}`)}</p>
      {!layout.retryPending && <button type="button" onClick={() => {
        if (!layout.failure) void personalLayout?.controller.load();
        else if (personalEditing && layout.failure === "conflict") {
          layout.controller.cancel();
          void teamLayout.controller.load();
        }
        else void layout.controller.load();
      }}>{t(layout.draft ? "dashboardLayout.reload" : "dashboardLayout.retry")}</button>}
    </div>}
    {layout.loading ? <div className={styles.loading} role="status"><LoaderCircle size={20} className={surface.spin} />{t("dashboardLayout.loading")}</div>
      : !board ? !layout.failure && <DashboardEmpty editing={false} canEdit={canEdit} onAdd={openCatalog} />
      : !board.widgets.length ? <DashboardEmpty editing={editing} canEdit={canEdit && !disabled && layout.failure !== "conflict"} onAdd={openCatalog} />
      : <DashboardContent key={scope} {...props} layout={layout} model={model} personalEditing={personalEditing} />}
  </div>;
}
