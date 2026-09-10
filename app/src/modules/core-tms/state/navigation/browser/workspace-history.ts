import { transitionContent } from "../../../presentation/workspace/motion/transition/content-transition";
import { createNavigationHistory, navigationEntry } from "../history/history";
import { createNavigationContextStore } from "../context/navigation-context-store";
export const HISTORY_CHANGE = "falcon:navigation";
const ends = new Map<string, number>();
const contexts = createNavigationContextStore({
  read: key => window.sessionStorage.getItem(key),
  write: (key, value) => window.sessionStorage.setItem(key, value),
});
function historyState() {
  const state = window.history.state;
  const entry = navigationEntry(state);
  return entry ? { ...state, falconNavigation: contexts.read(entry) } : state;
}
function writeHistory(method: "replaceState" | "pushState", state: Record<string, unknown>, href: string) {
  const urlChanged = href !== window.location.href;
  window.history[method](urlChanged ? applicationHistoryState(state) : state, "", href);
  const entry = navigationEntry(state);
  // A new branch can reuse a forward entry's index; replace its stored context too.
  if (entry) contexts.write(entry);
}
function applicationHistoryState(state: Record<string, unknown>) {
  // Passing Next's internal markers bypasses its native-history URL synchronization.
  // Its wrapper restores the current router internals after receiving our custom state.
  const { __NA: _appRouter, _N: _router, __N: _pagesRouter, __PRIVATE_NEXTJS_INTERNALS_TREE: _tree, ...custom } = state;
  return custom;
}
const history = () => createNavigationHistory({
  href: () => window.location.href, state: historyState,
  replace: (state, href) => writeHistory("replaceState", state, href),
  push: (state, href) => writeHistory("pushState", state, href),
  saveContext: entry => contexts.write(entry),
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
  : (navigationEntry(historyState())?.context[key] as T | undefined) ?? fallback;
export const saveNavigationContext = (key: string, value: unknown) => history().context(key, value);

export const visitWorkspace = (href: string) => transitionContent(() => {
  navigateWorkspace(href);
  window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
});
