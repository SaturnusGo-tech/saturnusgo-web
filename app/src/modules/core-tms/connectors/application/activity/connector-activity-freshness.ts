export class ConnectorActivityFreshness {
  private loadedAt: number | null = null;
  private handledEntry = false;

  reset() {
    this.loadedAt = null;
    this.handledEntry = false;
  }

  loaded(now = Date.now()) {
    this.loadedAt = now;
  }

  refreshOnEntry(active: boolean, available: boolean, now = Date.now()) {
    if (!active) {
      this.handledEntry = false;
      return false;
    }
    if (this.handledEntry || !available) return false;
    this.handledEntry = true;
    return this.loadedAt === null || now - this.loadedAt >= 15_000;
  }
}
