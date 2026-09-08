import { widgetKey } from "../model/widget-catalog";
import { LayoutError, moveWidget, placeWidgets, type BoardDraft, type BoardScope,
  type BoardWidget, type LayoutSource, type LayoutState, type ProjectBoard } from "../model/layout";

export class DashboardLayoutController {
  private state: LayoutState = { loading: true, saving: false, board: null, draft: null, failure: null, retryPending: false };
  private listeners = new Set<() => void>();
  private reader: AbortController | null = null;
  private generation = 0;
  private attempt: { current: ProjectBoard | null; draft: BoardDraft; key: string } | null = null;
  constructor(private source: LayoutSource, private scope: BoardScope, private nextKey: () => string) {}
  getState = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit(patch: Partial<LayoutState>) {
    this.state = { ...this.state, ...patch }; this.listeners.forEach((listener) => listener());
  }
  dispose = () => { this.reader?.abort(); this.generation += 1; };
  load = async () => {
    this.reader?.abort(); const reader = new AbortController(); this.reader = reader;
    const generation = ++this.generation;
    this.attempt = null;
    this.emit({ loading: true, failure: null, draft: null, saving: false, retryPending: false });
    try {
      const board = await this.source.load(this.scope, reader.signal);
      if (generation === this.generation && !reader.signal.aborted) this.emit({ board, loading: false });
    } catch (error) {
      if (generation === this.generation && !reader.signal.aborted) {
        this.emit({ loading: false, failure: error instanceof LayoutError ? error.kind : "unavailable" });
      }
    }
  };
  edit = (name: string) => {
    if (this.state.loading || this.state.saving || this.state.retryPending) return;
    const board = this.state.board;
    this.emit({ draft: board ? { name: board.name, widgets: board.widgets } : { name, widgets: [] }, failure: null });
  };
  cancel = () => {
    if (this.state.saving || this.state.retryPending) return;
    this.emit({ draft: null, failure: null });
  };
  private change(draft: BoardDraft) {
    if (!this.state.draft || this.state.saving || this.state.retryPending || this.state.failure === "conflict") return;
    this.attempt = null; this.emit({ draft, failure: null });
  }
  rename = (name: string) => { if (this.state.draft) this.change({ ...this.state.draft, name }); };
  add = (widgets: BoardWidget[]) => {
    const draft = this.state.draft;
    if (draft) {
      const existing = new Set(draft.widgets.map(widgetKey));
      const missing = widgets.filter((widget) => { const key = widgetKey(widget);
        if (existing.has(key)) return false; existing.add(key); return true; });
      if (draft.widgets.length + missing.length > 100) return;
      this.change({ ...draft, widgets: placeWidgets([...draft.widgets, ...missing]) });
    }
  };
  remove = (id: string) => {
    const draft = this.state.draft;
    if (draft) this.change({ ...draft, widgets: placeWidgets(draft.widgets.filter((widget) => widget.id !== id)) });
  };
  move = (id: string, to: number) => {
    const draft = this.state.draft;
    if (draft) this.change({ ...draft, widgets: moveWidget(draft.widgets, id, to) });
  };
  resize = (id: string, width: number) => {
    const draft = this.state.draft;
    if (draft && [3,6,12].includes(width)) this.change({ ...draft, widgets: placeWidgets(draft.widgets.map((widget) =>
      widget.id === id ? { ...widget, position: { ...widget.position, width } } : widget)) });
  };
  save = async () => {
    const draft = this.state.draft;
    if (!draft || this.state.saving || this.state.failure === "conflict" || !draft.name.trim() || draft.name.trim().length > 200) return;
    const generation = this.generation;
    this.attempt ??= { current: this.state.board, draft: structuredClone(draft), key: this.nextKey() };
    const attempt = this.attempt;
    this.emit({ saving: true, failure: null });
    try {
      const board = await this.source.save(this.scope, attempt.current, attempt.draft, attempt.key);
      if (generation !== this.generation) return;
      this.attempt = null;
      this.emit({ board, draft: null, saving: false, retryPending: false });
    } catch (error) {
      if (generation !== this.generation) return;
      const kind = error instanceof LayoutError ? error.kind : "unavailable";
      if (kind !== "unavailable") this.attempt = null;
      this.emit({ saving: false, failure: kind, retryPending: kind === "unavailable" });
    }
  };
}
