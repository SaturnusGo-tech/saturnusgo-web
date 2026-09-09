type Request = { controller: AbortController; active: boolean };

export function createWorkspaceRequests() {
  let navigation: Request | null = null;
  let navigationVersion = 0;
  const refreshes = new Map<string, Request>();

  function cancelRefreshes() {
    for (const request of refreshes.values()) request.controller.abort();
    refreshes.clear();
  }
  function lease(request: Request, current: () => boolean) {
    return {
      signal: request.controller.signal,
      isCurrent: () => !request.controller.signal.aborted && current(),
      finish: () => { request.active = false; },
      abort: () => { request.controller.abort(); request.active = false; },
    };
  }
  return {
    captureNavigationGuard() {
      const version = navigationVersion;
      const available = !navigation?.active;
      return () => available && version === navigationVersion && !navigation?.active;
    },
    beginNavigation() {
      navigationVersion += 1;
      navigation?.controller.abort();
      cancelRefreshes();
      const request = { controller: new AbortController(), active: true };
      navigation = request;
      return lease(request, () => navigation === request);
    },
    beginRefresh(scope: string) {
      if (navigation?.active) return null;
      refreshes.get(scope)?.controller.abort();
      const request = { controller: new AbortController(), active: true };
      refreshes.set(scope, request);
      return lease(request, () => refreshes.get(scope) === request);
    },
    cancel() {
      navigationVersion += 1;
      navigation?.controller.abort();
      navigation = null;
      cancelRefreshes();
    },
  };
}
