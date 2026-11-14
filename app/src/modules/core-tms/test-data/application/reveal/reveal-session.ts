const safeErrors = ["STEP_UP_UNAVAILABLE", "CREDENTIAL_VERSION_CHANGED", "CREDENTIAL_DISABLED"] as const;
type State = { readonly status: "hidden" | "pending" | "error"; readonly errorCode?: typeof safeErrors[number] } | { readonly status: "visible"; readonly value: string; readonly expiresAt: number };
type Clock = { now(): number; schedule(callback: () => void, delay: number): () => void };
export function createRevealSession(clock: Clock) {
  let state: State = { status: "hidden" }, generation = 0, scope = "";
  let cancelTimer: (() => void) | undefined;
  const listeners = new Set<() => void>();
  function set(next: State) { state = next; for (const listener of listeners) listener(); }
  function hide() { generation++; cancelTimer?.(); cancelTimer = undefined; set({ status: "hidden" }); }
  return {
    read: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hide,
    changeScope(next: string) { if (scope !== next) { hide(); scope = next; } },
    async reveal(nextScope: string, request: () => Promise<{ value: string; expiresAt: number }>) {
      hide(); scope = nextScope;
      const owner = generation;
      set({ status: "pending" });
      try {
        const response = await request();
        if (owner !== generation || scope !== nextScope) return;
        const expiresAt = Math.min(response.expiresAt, clock.now() + 30_000);
        if (expiresAt <= clock.now()) { hide(); return; }
        set({ status: "visible", value: response.value, expiresAt });
        cancelTimer = clock.schedule(hide, expiresAt - clock.now());
      } catch (failure) {
        const errorCode = failure && typeof failure === "object" && "code" in failure ? safeErrors.find(code => code === failure.code) : undefined;
        if (owner === generation && scope === nextScope) set({ status: "error", ...(errorCode ? { errorCode } : {}) });
      }
    },
  };
}
