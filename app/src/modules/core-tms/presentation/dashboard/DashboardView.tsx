"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Plus, Pencil } from "lucide-react";
import { useDashboardLayout } from "../../dashboards/layout/application/useDashboardLayout";
import { createBoardWidget, widgetKey } from "../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { DashboardContent } from "./customize/DashboardContent";
import { DashboardEmpty } from "./customize/empty/DashboardEmpty";
import { WidgetCatalog } from "./customize/catalog/WidgetCatalog";
import type { DashboardViewProps } from "./dashboard-view";
import surface from "./dashboard.module.css";
import styles from "./customize/layout.module.css";
import shell from "../../tms.module.css";

export function DashboardView(props: DashboardViewProps) {
  const { data, projectId } = props; const { t, locale } = useTmsLocale();
  const layout = useDashboardLayout({ workspaceId: data.workspace.id, projectId });
  const [catalogScope, setCatalogScope] = useState<string | null>(null);
  const scope = `${data.workspace.id}:${projectId}`;
  const board = layout.draft ?? layout.board; const editing = Boolean(layout.draft);
  const canEdit = data.meta.authorization.capabilities.includes("report:manage");
  const disabled = layout.saving || layout.retryPending;
  const currentProject = data.projects.find((project) => project.id === projectId)?.name ?? projectId;
  const create = () => { layout.controller.edit(t("dashboardLayout.defaultName")); };
  const openCatalog = () => setCatalogScope(scope);
  const catalogOpen = editing && catalogScope === scope;
  const addButton = useRef<HTMLButtonElement>(null);
  const wasCatalogOpen = useRef(false);
  useEffect(() => { setCatalogScope(null); }, [scope]);
  useEffect(() => {
    if (!catalogOpen && wasCatalogOpen.current) addButton.current?.focus();
    wasCatalogOpen.current = catalogOpen;
  }, [catalogOpen]);
  if (catalogOpen) return <div className={`${shell.pageScroll} ${surface.page} ${styles.page}`} data-dashboard-workspace="true">
    <WidgetCatalog dashboardName={board!.name} selected={new Set(board!.widgets.map(widgetKey))}
      onBack={() => setCatalogScope(null)}
      onAdd={(definitions) => layout.controller.add(definitions.map((definition) => createBoardWidget(definition, locale, crypto.randomUUID())))} />
  </div>;
  return <div className={`${shell.pageScroll} ${surface.page} ${styles.page}`} data-dashboard-workspace="true">
    <header className={styles.header}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>{currentProject}<span> / </span>{t("dashboard.analyticsTitle")}</span>
        {editing ? <input className={styles.name} aria-label={t("dashboardLayout.name")} maxLength={200}
          value={layout.draft!.name} disabled={disabled || layout.failure === "conflict"} onChange={(event) => layout.controller.rename(event.target.value)} />
          : <h1>{board?.name ?? t("dashboard.analyticsTitle")}</h1>}
        {board && <p>{t(editing ? "dashboardLayout.editHint" : "dashboardLayout.project")}</p>}
      </div>
      {!layout.loading && <div className={styles.actions}>
        {editing ? <>
          <button type="button" className={styles.quiet} disabled={disabled} onClick={() => { setCatalogScope(null); layout.controller.cancel(); }}>{t("dashboardLayout.cancel")}</button>
          <button type="button" ref={addButton} className={styles.secondary} disabled={disabled || layout.failure === "conflict"} onClick={openCatalog}><Plus size={15} />{t("dashboardLayout.add")}</button>
          <button type="button" className={styles.primary} disabled={layout.saving || !layout.draft!.name.trim() || layout.failure === "conflict"}
            onClick={() => void layout.controller.save()}>{layout.saving && <LoaderCircle size={15} className={surface.spin} />}{t(layout.saving ? "dashboardLayout.saving" : layout.retryPending ? "dashboardLayout.retry" : "dashboardLayout.save")}</button>
        </> : canEdit && board && <button type="button" className={styles.editButton} onClick={create} aria-label={t("dashboardLayout.edit")} title={t("dashboardLayout.edit")}><Pencil size={15} />{t("dashboardLayout.edit")}</button>}
      </div>}
    </header>
    {layout.failure && <div className={styles.failure} role="alert">
      <p>{t(!layout.board && !layout.draft && layout.failure === "unavailable" ? "dashboardLayout.loadError" : `dashboardLayout.${layout.failure}`)}</p>
      {!layout.retryPending && <button type="button" onClick={() => void layout.controller.load()}>{t(layout.draft ? "dashboardLayout.reload" : "dashboardLayout.retry")}</button>}
    </div>}
    {layout.loading ? <div className={styles.loading} role="status"><LoaderCircle size={20} className={surface.spin} />{t("dashboardLayout.loading")}</div>
      : !board ? !layout.failure && <DashboardEmpty editing={false} canEdit={canEdit} onCreate={create} />
      : !board.widgets.length ? <DashboardEmpty editing={editing} canEdit={canEdit && !disabled} onCreate={editing ? openCatalog : create} />
      : <DashboardContent key={scope} {...props} layout={layout} />}
  </div>;
}
