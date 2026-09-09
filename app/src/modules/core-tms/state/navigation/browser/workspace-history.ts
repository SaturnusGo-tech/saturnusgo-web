import { transitionContent } from "../../../presentation/workspace/motion/transition/content-transition";
import { createNavigationHistory, navigationEntry } from "../history/history";
export const HISTORY_CHANGE = "falcon:navigation";
const ends = new Map<string, number>();
function applicationHistoryState(state: Record<string, unknown>) {
  // Passing Next's internal markers bypasses its native-history URL synchronization.
  // Its wrapper restores the current router internals after receiving our custom state.
  const { __NA: _appRouter, _N: _router, __N: _pagesRouter, __PRIVATE_NEXTJS_INTERNALS_TREE: _tree, ...custom } = state;
  return custom;
}
const history = () => createNavigationHistory({
  href: () => window.location.href, state: () => window.history.state,
  replace: (state, href) => window.history.replaceState(applicationHistoryState(state), "", href),
  push: (state, href) => window.history.pushState(applicationHistoryState(state), "", href),
  changed: () => window.dispatchEvent(new Event(HISTORY_CHANGE)),
  session: () => crypto.randomUUID(),
  readEnd: session => {
    try { return Number(window.sessionStorage.getItem(`falcon.navigation.${session}`)) || ends.get(session) || 0; }
    catch { return ends.get(session) ?? 0; }
  },
  writeEnd: (session, index) => {
    ends.set(session, index);
    try { window.sessionStorage.setItem(`falcon.navigation.${session}`, String(index)); } catch { /* Browser history remains available without storage. */ }
  },
});
export const navigateWorkspace = (href: string, replace = false, extra?: Record<string, unknown>) => history().write(href, replace, extra);
export const initializeWorkspaceHistory = () => history().initialize();
export const workspaceHistoryPosition = () => history().position();
export const readNavigationContext = <T,>(key: string, fallback: T): T => typeof window === "undefined" ? fallback
  : (navigationEntry(window.history.state)?.context[key] as T | undefined) ?? fallback;
export const saveNavigationContext = (key: string, value: unknown) => history().context(key, value);

export const visitWorkspace = (href: string) => transitionContent(() => {
  navigateWorkspace(href);
  window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
});
