export type AuthoringSession = {
  dirty: boolean;
  revision?: string | number;
  busy?: boolean;
  beforeLeave?: () => Promise<boolean>;
};
type ApprovedCommit = (update: () => void) => void;
type Presenter = (kind: "discard" | "busy" | "error") => Promise<boolean>;

/** Coordinates a whole navigation intent, never individual state setters. */
export class AuthoringLeaveCoordinator {
  private sessions = new Map<string, () => AuthoringSession>();
  private presenter: Presenter = async () => false;
  private pending = false;
  private bypass = 0;
  private leaving = false;
  private approvedCommit?: ApprovedCommit;

  register(id: string, read: () => AuthoringSession) {
    this.sessions.set(id, read);
    return () => { if (this.sessions.get(id) === read) this.sessions.delete(id); };
  }
  setPresenter(presenter: Presenter) {
    this.presenter = presenter;
    return () => { if (this.presenter === presenter) this.presenter = async () => false; };
  }
  hasChanges() { return [...this.sessions.values()].some(read => read().dirty || read().busy); }
  isPending() { return this.pending; }
  shouldWarnOnUnload() { return !this.leaving && this.hasChanges(); }

  async request(action: (commit: ApprovedCommit) => unknown | Promise<unknown>): Promise<boolean> {
    if (this.bypass && this.approvedCommit) { await action(this.approvedCommit); return true; }
    if (this.pending) return false;
    this.pending = true;
    let active = true;
    const commit: ApprovedCommit = update => {
      if (!active) return;
      const previous = this.approvedCommit;
      this.approvedCommit = commit; this.bypass++;
      try { update(); } finally { this.bypass--; this.approvedCommit = previous; }
    };
    try {
      const snapshots = () => [...this.sessions].map(([id, read]) => ({ id, read, session: read() }));
      type Snapshot = ReturnType<typeof snapshots>[number];
      type Accepted = Pick<Snapshot, "read"> & { revision?: string | number };
      const approved = new Map<string, Accepted>(), saved = new Map<string, Accepted>();
      const matches = (map: Map<string, Accepted>, entry: Snapshot) => {
        const previous = map.get(entry.id);
        return previous?.read === entry.read && previous.revision === entry.session.revision;
      };
      const needsApproval = (entry: Snapshot) => entry.session.dirty && !entry.session.beforeLeave && !matches(approved, entry);
      for (;;) {
        const sessions = snapshots();
        if (sessions.some(entry => entry.session.busy)) { await this.presenter("busy"); return false; }
        const changed = sessions.filter(needsApproval);
        if (changed.length && !await this.presenter("discard")) return false;
        for (const entry of changed) approved.set(entry.id, { read: entry.read, revision: entry.session.revision });
        for (const entry of sessions) {
          if (!entry.session.dirty || !entry.session.beforeLeave || matches(saved, entry)) continue;
          if (!await entry.session.beforeLeave()) return false;
          saved.set(entry.id, { read: entry.read, revision: entry.read().revision });
        }
        const latest = snapshots();
        if (latest.some(entry => entry.session.busy || needsApproval(entry)
          || entry.session.dirty && entry.session.beforeLeave && !matches(saved, entry))) continue;
        break;
      }
      this.leaving = true;
      let result: unknown;
      commit(() => { result = action(commit); });
      await result;
      return true;
    } catch {
      await this.presenter("error");
      return false;
    } finally { active = false; this.pending = false; this.leaving = false; }
  }
}
