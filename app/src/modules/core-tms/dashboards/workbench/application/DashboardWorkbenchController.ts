import type {
  DashboardWorkbenchSource, WorkbenchFailure, WorkbenchFilters, WorkbenchKind,
  WorkbenchQuery, WorkbenchScope, WorkbenchState,
} from "../model/workbench";
import { workbenchKey } from "../model/workbench";
import { WorkbenchReadError } from "../model/workbench-error";

const failureOf = (error: unknown): WorkbenchFailure => error instanceof WorkbenchReadError
  ? error.failure : { kind: "error", requestId: null };
const mustClear = (error: WorkbenchFailure) =>
  error.kind === "authentication" || error.kind === "permission" || error.kind === "scope";

export class DashboardWorkbenchController {
  private state: WorkbenchState = { key: "", snapshot: null, loading: false, error: null, drill: null };
  private query: WorkbenchQuery | null = null;
  private summaryRequest: AbortController | null = null;
  private drillRequest: AbortController | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly source: DashboardWorkbenchSource) {}

  readonly getState = () => this.state;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  configure(scope: WorkbenchScope, filters: WorkbenchFilters): void {
    const key = workbenchKey({ ...scope, ...filters });
    if (key === this.state.key && this.query) return;
    this.cancel();
    this.query = { ...scope, ...filters, limit: 20 };
    this.update({ key, snapshot: null, loading: false, error: null, drill: null });
    void this.refresh();
  }

  readonly refresh = async (): Promise<void> => {
    if (!this.query) return;
    this.summaryRequest?.abort();
    const request = new AbortController();
    this.summaryRequest = request;
    const query = this.query;
    this.update({ ...this.state, loading: true, error: null });
    try {
      const snapshot = await this.source.read(query, request.signal);
      if (request.signal.aborted || this.summaryRequest !== request) return;
      this.update({ ...this.state, snapshot, loading: false, error: null });
    } catch (error) {
      if (request.signal.aborted || this.summaryRequest !== request) return;
      const failure = failureOf(error);
      if (mustClear(failure)) this.closeDrill();
      this.update({ ...this.state, snapshot: mustClear(failure) ? null : this.state.snapshot,
        loading: false, error: failure });
    }
  };

  readonly openDrill = (kind: WorkbenchKind): void => {
    if (!this.query) return;
    this.drillRequest?.abort();
    this.update({ ...this.state, drill: { kind, page: null, loading: false, error: null, requestCursor: null } });
    void this.retryDrill();
  };

  readonly retryDrill = (): Promise<void> => this.loadDrill(this.state.drill?.requestCursor ?? undefined);
  readonly refreshDrill = (): Promise<void> => this.loadDrill();
  readonly loadMore = (): Promise<void> => {
    const drill = this.state.drill;
    return drill && !drill.loading && drill.page?.nextCursor
      ? this.loadDrill(drill.page.nextCursor) : Promise.resolve();
  };

  private async loadDrill(cursor?: string): Promise<void> {
    if (!this.query || !this.state.drill) return;
    this.drillRequest?.abort();
    const request = new AbortController();
    this.drillRequest = request;
    const kind = this.state.drill.kind;
    const query = { ...this.query, kind, limit: 25, ...(cursor ? { cursor } : {}) };
    this.update({ ...this.state, drill: { ...this.state.drill, loading: true, error: null, requestCursor: cursor ?? null } });
    try {
      let page = await this.source.records(query, request.signal);
      if (request.signal.aborted || this.drillRequest !== request) return;
      if (cursor && this.state.drill?.page) {
        const rows = new Map([...this.state.drill.page.queue.rows, ...page.queue.rows].map((row) => [
          `${row.navigation.projectId}:${row.navigation.entity}:${row.navigation.id}`, row,
        ]));
        page = { ...page, queue: { ...page.queue, rows: [...rows.values()] } };
      }
      this.update({ ...this.state, drill: { kind, page, loading: false, error: null, requestCursor: cursor ?? null } });
    } catch (error) {
      if (request.signal.aborted || this.drillRequest !== request) return;
      const failure = failureOf(error);
      if (mustClear(failure)) {
        this.summaryRequest?.abort();
        this.update({ ...this.state, snapshot: null, loading: false, error: failure,
          drill: { kind, page: null, loading: false, error: failure, requestCursor: cursor ?? null } });
      } else this.update({ ...this.state, drill: {
        kind, page: this.state.drill?.page ?? null, loading: false, error: failure, requestCursor: cursor ?? null,
      } });
    }
  }

  readonly closeDrill = (): void => {
    this.drillRequest?.abort();
    this.drillRequest = null;
    this.update({ ...this.state, drill: null });
  };

  reset(): void {
    this.cancel();
    this.query = null;
    this.update({ key: "", snapshot: null, loading: false, error: null, drill: null });
  }

  private cancel(): void {
    this.summaryRequest?.abort();
    this.drillRequest?.abort();
    this.summaryRequest = null;
    this.drillRequest = null;
  }

  private update(state: WorkbenchState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}
