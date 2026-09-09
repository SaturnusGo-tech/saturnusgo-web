import { useEffect, useRef } from "react";
import type { DashboardDrill } from "../../../dashboards/model/dashboard-analytics";
import type { WorkbenchKind } from "../../../dashboards/workbench/model/workbench";
import type { DashboardModel } from "../customize/model/useDashboardModel";
import { drillHref, readDrillRoute, type DrillRoute } from "./drill-route";
export function useDrillNavigation(model: DashboardModel) {
  const latest = useRef(model); latest.current = model;
  const pending = useRef<DrillRoute | null>(null);
  const origin = useRef<{ widget: string; button: number; scroll: number } | null>(null);
  const remember = () => {
    if (document.querySelector("[data-dashboard-detail]")) return;
    const focused = document.activeElement; const widget = focused?.closest<HTMLElement>("[data-widget-id]");
    origin.current = { widget: widget?.dataset.widgetId ?? "", button: widget ? [...widget.querySelectorAll("button")].indexOf(focused as HTMLButtonElement) : 0,
      scroll: document.querySelector("[data-dashboard-workspace]")?.scrollTop ?? 0 };
  };
  const restoreFocus = () => requestAnimationFrame(() => {
    const root = document.querySelector<HTMLElement>("[data-dashboard-workspace]"); if (!root || !origin.current) return;
    root.scrollTop = origin.current.scroll;
    const widget = [...root.querySelectorAll<HTMLElement>("[data-widget-id]")].find(item => item.dataset.widgetId === origin.current!.widget);
    widget?.querySelectorAll("button")[origin.current.button]?.focus({ preventScroll: true });
  });
  const apply = (route: DrillRoute | null) => {
    const m = latest.current;
    if (!route) { pending.current = null; m.analytics.closeDrill(); m.workbench.closeDrill(); restoreFocus(); return; }
    pending.current = route;
    if (!m.preferences.ready) return;
    if (route.kind === "analytics") {
      if (m.query.period !== route.period) { m.preferences.update({ period: route.period }); return; }
      m.workbench.closeDrill(); m.analytics.openDrill(route.selected, route.origin);
    } else {
      if (JSON.stringify(m.workbench.filters) !== JSON.stringify(route.filters)) { m.workbench.setFilters(route.filters); return; }
      m.analytics.closeDrill(); m.workbench.openDrill(route.selection);
    }
    pending.current = null;
  };
  const push = (route: DrillRoute) => {
    remember(); const href = drillHref(window.location.href, route);
    if (href !== window.location.href) {
      if (document.querySelector("[data-dashboard-detail]")) window.history.replaceState(window.history.state, "", href);
      else window.history.pushState({ ...window.history.state, falconDashboardDetail: true }, "", href);
    }
    apply(route);
  };
  useEffect(() => {
    const pop = () => apply(readDrillRoute(window.location.href));
    pop(); window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => { if (pending.current) apply(pending.current); }, [model.preferences.ready, model.query.period, model.workbench.filters.environmentId, model.workbench.filters.buildReference]);
  const close = () => {
    if (window.history.state?.falconDashboardDetail) window.history.back();
    else { window.history.replaceState(window.history.state, "", drillHref(window.location.href, null)); apply(null); }
  };
  return { close,
    openAnalytics: (drill: DashboardDrill) => push({ kind: "analytics", origin: drill, selected: drill, period: model.query.period }),
    related: (drill: DashboardDrill) => push({ kind: "analytics", origin: model.analytics.drill.origin ?? drill, selected: drill, period: model.query.period }),
    openWorkbench: (selection: WorkbenchKind) => push({ kind: "workbench", selection, filters: model.workbench.filters }),
  };
}
