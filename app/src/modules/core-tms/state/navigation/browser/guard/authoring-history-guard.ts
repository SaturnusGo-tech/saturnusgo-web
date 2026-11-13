type Position = { href: string; index?: number; session?: string; state?: Record<string, unknown> | null };
type Port = { read(): Position; changed(): boolean; go(delta: number): void;
  replace(position: Position): void; dispatch(): void; request(action: () => void): Promise<boolean> };

/** Rewind before confirmation so every resource listener sees only approved history. */
export class AuthoringHistoryGuard {
  private accepted: Position;
  private pending = false;
  private restored?: () => void;
  private replay?: Position;
  constructor(private port: Port) { this.accepted = port.read(); }
  private matches(expected: Position | undefined, current: Position) {
    return Boolean(expected && expected.href === current.href && expected.index === current.index && expected.session === current.session);
  }
  record() { if (!this.pending) this.accepted = this.port.read(); }
  capture(event: { stopImmediatePropagation(): void }) {
    const target = this.port.read();
    if (this.matches(this.replay, target)) { this.replay = undefined; this.accepted = target; return; }
    if (!this.pending && this.matches(this.accepted, target)) return;
    if (!this.pending && !this.port.changed()) { this.accepted = target; return; }
    event.stopImmediatePropagation();
    if (this.pending && this.matches(this.accepted, target)) { this.restored?.(); this.restored = undefined; return; }
    const delta = target.session === this.accepted.session && target.index !== undefined && this.accepted.index !== undefined
      ? this.accepted.index - target.index : 0;
    if (this.pending) { if (delta) this.port.go(delta); else this.port.replace(this.accepted); return; }
    this.pending = true;
    const restored = delta ? new Promise<void>(resolve => { this.restored = resolve; this.port.go(delta); })
      : Promise.resolve(this.port.replace(this.accepted));
    void restored.then(() => this.port.request(() => {
      this.replay = target;
      if (delta) this.port.go(-delta);
      else { this.port.replace(target); this.accepted = target; this.port.dispatch(); }
    })).finally(() => { this.pending = false; });
  }
}
