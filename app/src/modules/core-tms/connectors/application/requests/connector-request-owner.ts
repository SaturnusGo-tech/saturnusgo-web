export class ConnectorRequestOwner {
  private active: AbortController | null = null;
  begin(): AbortSignal {
    this.cancel();
    this.active = new AbortController();
    return this.active.signal;
  }
  current(signal: AbortSignal): boolean {
    return this.active?.signal === signal && !signal.aborted;
  }
  busy(): boolean {
    return this.active !== null;
  }
  finish(signal: AbortSignal): void {
    if (this.current(signal)) this.active = null;
  }
  cancel(): void {
    this.active?.abort(); this.active = null;
  }
}
