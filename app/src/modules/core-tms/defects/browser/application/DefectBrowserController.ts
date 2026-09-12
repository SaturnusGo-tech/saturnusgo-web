import { DefectBrowserAccessError } from "../model/defect-browser-error";
import { emptyDefectBrowser, type DefectBranch, type DefectBrowserQuery,
  type DefectBrowserSource, type DefectBrowserState } from "../model/defect-browser";

const emptyBranch = (): DefectBranch => ({ items: [], status: "idle", error: null, hasMore: false });
export class DefectBrowserController {
  private state = emptyDefectBrowser();
  private listeners = new Set<() => void>();
  private query: DefectBrowserQuery | null = null;
  private groupCursor: string | null = null;
  private branchCursors = new Map<string, string | null>();
  private requests = new Map<string, AbortController>();
  private generation = 0;
  public constructor(private readonly source: DefectBrowserSource) {}
  public getState = () => this.state;
  public subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(next: DefectBrowserState) { this.state = next; this.listeners.forEach((listener) => listener()); }
  public reset = () => {
    this.generation += 1;
    this.requests.forEach((request) => request.abort()); this.requests.clear();
    this.query = null; this.groupCursor = null; this.branchCursors.clear();
    this.publish(emptyDefectBrowser());
  };
  public configure = (key: string, query: DefectBrowserQuery) => {
    this.reset(); this.query = query; this.publish(emptyDefectBrowser(key)); void this.readGroups(false);
  };
  public refresh = () => {
    this.requests.forEach((request) => request.abort()); this.requests.clear();
    void this.readGroups(false);
    Object.keys(this.state.branches).forEach((component) => { void this.readBranch(component, false); });
  };
  public retryGroups = () => { void this.readGroups(false); };
  public loadMoreGroups = () => { if (this.state.hasMoreGroups) void this.readGroups(true); };
  public openComponent = (component: string) => {
    if (!Object.prototype.hasOwnProperty.call(this.state.branches, component)) void this.readBranch(component, false);
  };
  public retryComponent = (component: string) => { void this.readBranch(component, false); };
  public loadMoreComponent = (component: string) => {
    if (Object.prototype.hasOwnProperty.call(this.state.branches, component) && this.state.branches[component].hasMore) {
      void this.readBranch(component, true);
    }
  };
  private async readGroups(append: boolean) {
    if (!this.query || this.requests.has("groups")) return;
    const query = this.query;
    const request = new AbortController(); const generation = this.generation;
    this.requests.set("groups", request);
    this.publish({ ...this.state, groupsStatus: "loading", groupsError: null });
    const cursor = append ? this.groupCursor : null;
    try {
      let page = await this.source.groups(query, cursor, request.signal);
      const refreshed = [...page.groups]; const seen = new Set<string>();
      while (!request.signal.aborted && generation === this.generation && !append && page.nextCursor !== null && refreshed.length < this.state.groups.length) {
        if (seen.has(page.nextCursor)) throw new Error("Repeated cursor");
        seen.add(page.nextCursor);
        page = await this.source.groups(query, page.nextCursor, request.signal);
        refreshed.push(...page.groups);
      }
      if (generation !== this.generation || request.signal.aborted) return;
      if (page.nextCursor !== null && page.nextCursor === cursor) throw new Error("Repeated cursor");
      const groups = new Map((append ? this.state.groups : []).map((group) => [group.component, group]));
      refreshed.forEach((group) => groups.set(group.component, group));
      this.groupCursor = page.nextCursor;
      this.publish({ ...this.state, groups: [...groups.values()], totals: page.totals,
        groupCount: page.groupCount, groupsStatus: "ready", groupsError: null,
        hasMoreGroups: page.nextCursor !== null });
    } catch (error) {
      if (generation === this.generation && !request.signal.aborted) {
        if (error instanceof DefectBrowserAccessError) { this.denyAccess(); return; }
        this.publish({ ...this.state, groupsStatus: "error", groupsError: "request_failed" });
      }
    } finally { if (this.requests.get("groups") === request) this.requests.delete("groups"); }
  }
  private async readBranch(component: string, append: boolean) {
    const key = `component:${component}`;
    if (!this.query || this.requests.has(key)) return;
    const query = this.query;
    const request = new AbortController(); const generation = this.generation;
    this.requests.set(key, request);
    const previous = Object.prototype.hasOwnProperty.call(this.state.branches, component) ? this.state.branches[component] : emptyBranch();
    this.branch(component, { ...previous, status: "loading", error: null });
    const cursor = append ? this.branchCursors.get(component) ?? null : null;
    try {
      let page = await this.source.records(query, component, cursor, request.signal);
      const refreshed = [...page.items]; const seen = new Set<string>();
      while (!request.signal.aborted && generation === this.generation && !append && page.nextCursor !== null && refreshed.length < previous.items.length) {
        if (seen.has(page.nextCursor)) throw new Error("Repeated cursor");
        seen.add(page.nextCursor);
        page = await this.source.records(query, component, page.nextCursor, request.signal);
        refreshed.push(...page.items);
      }
      if (generation !== this.generation || request.signal.aborted) return;
      if (page.nextCursor !== null && page.nextCursor === cursor) throw new Error("Repeated cursor");
      const items = new Map((append ? previous.items : []).map((item) => [item.id, item]));
      refreshed.forEach((item) => items.set(item.id, item));
      this.branchCursors.set(component, page.nextCursor);
      this.branch(component, { items: [...items.values()], status: "ready", error: null,
        hasMore: page.nextCursor !== null });
    } catch (error) {
      if (generation === this.generation && !request.signal.aborted) {
        if (error instanceof DefectBrowserAccessError) { this.denyAccess(); return; }
        this.branch(component, { ...previous, status: "error", error: "request_failed" });
      }
    } finally { if (this.requests.get(key) === request) this.requests.delete(key); }
  }
  private denyAccess() {
    this.requests.forEach((request) => request.abort()); this.requests.clear();
    this.branchCursors.clear(); this.groupCursor = null;
    this.publish({ ...emptyDefectBrowser(this.state.key), groupsStatus: "error", groupsError: "access_unavailable" });
  }
  private branch(component: string, branch: DefectBranch) {
    this.publish({ ...this.state, branches: Object.assign(Object.create(null), this.state.branches, { [component]: branch }) as Record<string, DefectBranch> });
  }
}
