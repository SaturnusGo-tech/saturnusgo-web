"use client";
import { transitionContent } from "../workspace/motion/transition/content-transition";
import { useTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Plus, Pencil } from "lucide-react";
import { usePersonalDashboardBoard } from "../../dashboards/layout/personal/board/usePersonalDashboardBoard";
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
  const boardScope = { workspaceId: data.workspace.id, projectId };
  const canManageTeam = data.meta.authorization.capabilities.includes("report:manage");
  const canComposePersonal = props.serverAnalytics === true && data.meta.authorization.capabilities.includes("report:read");
  const teamLayout = useDashboardLayout(boardScope);
  const personalBoard = usePersonalDashboardBoard(boardScope, canComposePersonal);
  const legacyLayout = usePersonalDashboardLayout(teamLayout.board,
    canComposePersonal && !personalBoard?.loading && !personalBoard?.board);
  const personalEditing = Boolean(personalBoard?.draft);
  const layout = teamLayout.draft ? teamLayout
    : personalBoard && (personalBoard.draft || personalBoard.board) ? personalBoard
    : legacyLayout?.board ? legacyLayout : teamLayout;
  const [catalogScope, setCatalogScope] = useState<string | null>(null);
  const scope = `${data.workspace.id}:${projectId}`;
  const board = layout.draft ?? layout.board;
  const editing = Boolean(layout.draft);
  const loading = layout.loading || Boolean(personalBoard?.loading && !teamLayout.draft);
  const disabled = layout.saving || layout.retryPending;
  const canEditPersonal = Boolean(personalBoard && !personalBoard.loading && !personalBoard.failure);
  const canEdit = editing || canEditPersonal || (!canComposePersonal && canManageTeam);
  const currentProject = data.projects.find((project) => project.id === projectId)?.name ?? projectId;
  const editPersonal = () => {
    if (canEditPersonal) {
      const template = legacyLayout?.board ?? teamLayout.board;
      personalBoard?.controller.edit(t("dashboardLayout.personalName"), template ? {
        name: t("dashboardLayout.personalName"), widgets: template.widgets,
      } : undefined);
    }
  };
  const editTeam = () => teamLayout.controller.edit(t("dashboardLayout.defaultName"));
  const edit = canComposePersonal ? editPersonal : editTeam;
  const openCatalog = () => transitionContent(() => {
    if (!editing) edit();
    setCatalogScope(scope);
  });
  const catalogOpen = editing && catalogScope === scope;
  const fallbackFailure = personalBoard?.failure ?? legacyLayout?.failure;
  const layoutFailure = layout === teamLayout && !teamLayout.draft && canEditPersonal ? null : layout.failure;
  const loadFailure = layoutFailure === "unavailable" && !board;
  const failure = layoutFailure ?? fallbackFailure;
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
        {editing ? <input data-inline-title className={styles.name} aria-label={t("dashboardLayout.name")} maxLength={200}
          value={layout.draft!.name} disabled={disabled || layout.failure === "conflict"} onChange={(event) => layout.controller.rename(event.target.value)} />
          : <h1>{board?.name ?? t("dashboard.analyticsTitle")}</h1>}
        <div className={styles.editDisclosure} data-open={editing} aria-hidden={!editing || undefined}>
          <div><p>{t(personalEditing ? "dashboardLayout.personalEditHint" : "dashboardLayout.editHint")}</p></div>
        </div>
      </div>
      {!loading && <div className={styles.actions}>
        <div className={styles.actionGroup} data-active={editing} inert={!editing} aria-hidden={!editing || undefined}>
          <button type="button" className={styles.quiet} disabled={disabled} onClick={() => { setCatalogScope(null); layout.controller.cancel(); }}>{t("dashboardLayout.cancel")}</button>
          <button type="button" ref={addButton} className={styles.secondary} disabled={disabled || layout.failure === "conflict"} onClick={openCatalog}><Plus size={15} />{t("dashboardLayout.add")}</button>
          <button type="button" className={styles.primary} disabled={layout.saving || !layout.draft?.name.trim() || layout.failure === "conflict"}
            onClick={() => void layout.controller.save()}>{layout.saving && <LoaderCircle size={15} className={surface.spin} />}{t(layout.saving ? "dashboardLayout.saving" : layout.retryPending ? "dashboardLayout.retry" : "dashboardLayout.save")}</button>
        </div>
        <div className={styles.actionGroup} data-active={!editing} inert={editing} aria-hidden={editing || undefined}>
          {canComposePersonal && canManageTeam && !teamLayout.loading && !teamLayout.failure &&
            <button type="button" className={styles.quiet} onClick={editTeam}>{t("dashboardLayout.editTeam")}</button>}
          {canEdit && board && <button type="button" className={styles.editButton} onClick={edit}
            aria-label={t("dashboardLayout.edit")} title={t("dashboardLayout.edit")}><Pencil size={15} />{t("dashboardLayout.edit")}</button>}
        </div>
      </div>}
    </header>
    {failure && <div className={styles.failure} role="alert">
      <p>{!layoutFailure ? t("dashboardLayout.personalSyncError") : t(loadFailure ? "dashboardLayout.loadError" : `dashboardLayout.${layoutFailure}`)}</p>
      {!layout.retryPending && <button type="button" onClick={() => {
        const failed = layoutFailure ? layout : personalBoard?.failure ? personalBoard : legacyLayout;
        void failed?.controller.load();
      }}>{t(layout.draft ? "dashboardLayout.reload" : "dashboardLayout.retry")}</button>}
    </div>}
    {loading ? <div className={styles.loading} role="status"><LoaderCircle size={20} className={surface.spin} />{t("dashboardLayout.loading")}</div>
      : !board ? !layoutFailure && !personalBoard?.failure && <DashboardEmpty editing={false} personal={canComposePersonal}
        canEdit={canEdit} onAdd={openCatalog} />
      : !board.widgets.length ? <DashboardEmpty editing={editing} personal={personalEditing || (!editing && canComposePersonal)}
        canEdit={canEdit && !disabled && layout.failure !== "conflict"} onAdd={openCatalog} />
      : <DashboardContent key={scope} {...props} layout={layout} model={model} />}
  </div>;
}
