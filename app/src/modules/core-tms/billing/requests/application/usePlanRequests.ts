import { useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import type { BillingPlanId } from "../../domain/billing";
import type { createPlanRequestApi } from "../data/plan-request-api";
import { pendingPlanStatuses, type PlanRequest, type PlanRequestList } from "../domain/plan-request";

type Api = ReturnType<typeof createPlanRequestApi>;
type RequestState = { api: Api; data: PlanRequestList | null; request: PlanRequest | null; error: boolean; accessDenied?: boolean };

export function usePlanRequests(api: Api | null, requestId: string | null, locale: "en" | "ru") {
  const [state, setState] = useState<RequestState | null>(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = useRef<Api | null>(api);
  active.current = api;
  const inFlight = useRef(false);
  const read = state?.api === api ? state : null;
  const data = read?.data ?? null;
  const current = data?.requests.find(request => pendingPlanStatuses.has(request.status)) ?? null;
  const activating = current?.status === "activating" || read?.request?.status === "activating";

  useEffect(() => {
    if (!api) return;
    const controller = new AbortController();
    void api.list(controller.signal).then(async value => {
      if (!Array.isArray(value?.requests) || !Array.isArray(value?.eligiblePlanIds)) throw new Error("Invalid plan request list");
      const request = requestId ? value.requests.find(item => item.id === requestId) ?? await api.get(requestId, controller.signal).catch(() => null) : null;
      if (!controller.signal.aborted) setState({ api, data: value, request, error: Boolean(requestId && !request) });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const accessDenied = error instanceof TmsApiError && error.status === 403 && String(error.code) === "PLAN_REQUEST_FORBIDDEN";
      setState(value => !accessDenied && value?.api === api
        ? { ...value, error: true, accessDenied: false }
        : { api, data: null, request: null, error: !accessDenied, accessDenied });
    });
    return () => controller.abort();
  }, [api, requestId, revision]);
  useEffect(() => {
    if (!activating || busy) return;
    const timer = setTimeout(() => setRevision(value => value + 1), 3000);
    return () => clearTimeout(timer);
  }, [activating, busy, read]);

  async function mutate(operation: (client: Api) => Promise<PlanRequest>) {
    if (!api || inFlight.current) return null;
    inFlight.current = true;
    setBusy(true);
    setFailed(false);
    try {
      const request = await operation(api);
      if (active.current !== api) return null;
      setState(value => value?.api === api && value.data ? { ...value, request: requestId === request.id ? request : value.request,
        data: { ...value.data, requests: [request, ...value.data.requests.filter(item => item.id !== request.id)] } } : value);
      setRevision(value => value + 1);
      return request;
    } catch {
      if (active.current === api) { setFailed(true); setRevision(value => value + 1); }
      return null;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return { data, current, request: read?.request ?? null, loading: Boolean(api && !read),
    error: read?.error ?? false, accessDenied: read?.accessDenied ?? false, busy, failed,
    reload: () => { setFailed(false); setRevision(value => value + 1); },
    submit: (plan: BillingPlanId, note: string) => mutate(client => client.submit(plan, locale, note)),
    act: (request: PlanRequest, action: "withdraw" | "activate", setup?: { setupId: string; setupVersion: number }) => mutate(client => client.act(request, action, setup)),
  };
}
