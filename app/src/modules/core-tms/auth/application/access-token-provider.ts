export type SilentAccessTokenGetter = () => Promise<string>;
export type TmsAccessTokenProvider = (signal?: AbortSignal) => Promise<string>;

export function createTmsAccessTokenProvider(
  getAccessTokenSilently: SilentAccessTokenGetter,
): TmsAccessTokenProvider {
  return async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    const pendingToken = Promise.resolve().then(getAccessTokenSilently);
    if (!signal) return pendingToken;
    return new Promise<string>((resolve, reject) => {
      const aborted = () => reject(
        signal.reason ?? new DOMException("Authentication cancelled", "AbortError"),
      );
      signal.addEventListener("abort", aborted, { once: true });
      pendingToken.then(resolve, reject).finally(() => {
        signal.removeEventListener("abort", aborted);
      });
    });
  };
}
