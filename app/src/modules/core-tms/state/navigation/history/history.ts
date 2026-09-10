export type NavigationEntry = { session: string; index: number; context: Record<string, unknown> };
export type HistoryPort = {
  href: () => string; state: () => Record<string, unknown> | null;
  replace: (state: Record<string, unknown>, href: string) => void;
  push: (state: Record<string, unknown>, href: string) => void;
  saveContext?: (entry: NavigationEntry) => void;
  changed: () => void; session: () => string;
  readEnd: (session: string) => number; writeEnd: (session: string, index: number) => void;
};
export function navigationEntry(state: Record<string, unknown> | null): NavigationEntry | null {
  const entry = state?.falconNavigation as NavigationEntry | undefined;
  return entry && typeof entry.session === "string" && Number.isSafeInteger(entry.index) && entry.index >= 0
    && entry.context && typeof entry.context === "object" ? entry : null;
}
export function createNavigationHistory(port: HistoryPort) {
  const initialize = () => {
    const existing = navigationEntry(port.state());
    if (existing) return existing;
    const entry: NavigationEntry = { session: port.session(), index: 0, context: {} };
    port.replace({ ...port.state(), falconNavigation: entry }, port.href());
    port.writeEnd(entry.session, 0);
    return entry;
  };
  return {
    initialize,
    write(href: string, replace = false, extra: Record<string, unknown> = {}) {
      const destination = new URL(href, port.href()); const current = new URL(port.href());
      if (destination.origin !== current.origin || destination.pathname !== current.pathname) throw new Error("Navigation must stay inside the workspace");
      const entry = initialize();
      if (destination.href === current.href) return;
      const state = { ...port.state(), falconDashboardDetail: undefined, ...extra,
        falconNavigation: replace ? entry : { ...entry, index: entry.index + 1, context: { ...entry.context, scroll: undefined } } };
      if (replace) port.replace(state, destination.href);
      else { port.push(state, destination.href); port.writeEnd(entry.session, entry.index + 1); }
      port.changed();
    },
    context(key: string, value: unknown) {
      const entry = initialize();
      if (JSON.stringify(entry.context[key]) === JSON.stringify(value)) return;
      const context = { ...entry.context, [key]: value };
      // UI state only; cap retained screen contexts when exploring large workspaces.
      const keys = Object.keys(context); keys.slice(0, Math.max(0, keys.length - 80)).forEach(key => delete context[key]);
      const next = { ...entry, context };
      if (port.saveContext) port.saveContext(next);
      else port.replace({ ...port.state(), falconNavigation: next }, port.href());
    },
    position() {
      const entry = initialize();
      return { back: entry.index > 0, forward: entry.index < port.readEnd(entry.session) };
    },
  };
}
