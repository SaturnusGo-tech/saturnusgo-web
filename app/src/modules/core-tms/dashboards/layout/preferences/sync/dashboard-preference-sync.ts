import { personalViewConflict, type PersonalResource, type PersonalView, type PersonalViewSource } from "../data/personal-view-source";
import { defaultPreferences, type DashboardPreferences } from "../preferences";

type Resource = PersonalResource<Extract<PersonalView, { kind: "preferences" }>>;
type Patch = Partial<DashboardPreferences>;
type State = { readonly value: DashboardPreferences; readonly stored: boolean; readonly ready: boolean };

export class DashboardPreferenceSync {
  private request = new AbortController();
  private resource: Resource | undefined;
  private pending: Patch = {};
  private legacy: DashboardPreferences | null = null;
  private attempt: { key: string; etag: string; patch: Patch; migration: boolean } | undefined;
  private running = false;
  private snapshot: State = { value: defaultPreferences, stored: true, ready: false };
  private listeners = new Set<() => void>();

  constructor(private source: PersonalViewSource<Resource["data"]>, private nextKey: () => string) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  start = (legacy: DashboardPreferences | null) => {
    if (this.request.signal.aborted) this.request = new AbortController();
    this.legacy = legacy;
    void this.refresh();
  };
  stop = () => { this.request.abort(); this.running = false; };
  update = (patch: Patch) => {
    this.pending = { ...this.pending, ...patch };
    this.publish(this.snapshot.stored);
    void this.refresh();
  };
  refresh = async () => {
    if (this.running || this.request.signal.aborted) return;
    const signal = this.request.signal;
    this.running = true;
    try {
      const retrying = this.attempt;
      if (!retrying) this.resource = await this.source.load(signal);
      signal.throwIfAborted();
      this.publish(true);
      // A losing legacy import must never be reapplied to a newer server version.
      for (let conflicts = 0; conflicts < 2;) {
        this.prepare();
        const attempt = this.attempt;
        if (!attempt) break;
        try {
          const saved = await this.source.save({ kind: "preferences", patch: attempt.patch },
            attempt.etag, attempt.key, signal);
          signal.throwIfAborted();
          this.resource = saved;
          this.legacy = null;
          this.attempt = undefined;
          // An idempotency replay may describe a version superseded by another surface.
          if (attempt === retrying) this.resource = await this.source.load(signal);
          signal.throwIfAborted();
          this.publish(true);
        } catch (error) {
          signal.throwIfAborted();
          if (!personalViewConflict(error)) throw error;
          this.attempt = undefined;
          this.legacy = null;
          if (!attempt.migration) this.pending = { ...attempt.patch, ...this.pending };
          this.resource = await this.source.load(signal);
          signal.throwIfAborted();
          this.publish(true);
          conflicts += 1;
        }
      }
      if (Object.keys(this.pending).length > 0) this.publish(false);
    } catch {
      if (!signal.aborted) this.publish(false);
    } finally {
      if (!signal.aborted) this.running = false;
    }
  };

  private prepare() {
    if (!this.resource || this.attempt) return;
    if (this.resource.data.rowVersion === 0 && this.legacy) {
      this.attempt = { key: this.nextKey(), etag: this.resource.etag, patch: this.legacy, migration: true };
    } else if (Object.keys(this.pending).length > 0) {
      this.legacy = null;
      this.attempt = { key: this.nextKey(), etag: this.resource.etag, patch: this.pending, migration: false };
      this.pending = {};
    }
  }

  private publish(stored: boolean) {
    this.snapshot = { stored, ready: Boolean(this.resource), value: {
      ...(this.resource?.data.preferences ?? this.legacy ?? defaultPreferences),
      ...(!this.attempt?.migration ? this.attempt?.patch : undefined), ...this.pending,
    } };
    this.listeners.forEach(listener => listener());
  }
}
