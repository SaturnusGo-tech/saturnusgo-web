import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createAuthenticatedTmsHttpClient } from "../../../../../auth/http/createAuthenticatedTmsHttpClient";
import { TmsHttpClientProvider } from "../../../../../auth/http/TmsHttpClientContext";
import { configuration } from "../../../../../youtrack/application/plugin-settings/tests/toggle-harness";
import { hooksCopy } from "../../../shared/hooks-copy";
import { useYouTrackSettings } from "../../state/use-youtrack-settings";

export async function catalogHarness(initial: "empty" | "failure" | "ready" | "credentials", canManage = true) {
  const originalReact = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const saved = configuration(), requests: { method: string; path: string; body: Record<string, unknown> | null }[] = [];
  let disconnectFailure = false;
  let mode = initial, model!: ReturnType<typeof useYouTrackSettings>, view!: ReactTestRenderer;
  const http = createAuthenticatedTmsHttpClient({ apiBase: "https://fixture.invalid/api/v1", production: false, credentials: "include",
    fetch: async (input, init) => {
      init?.signal?.throwIfAborted();
      const method = init?.method ?? "GET", path = new URL(String(input)).pathname;
      const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : null;
      requests.push({ method, path, body });
      if (method === "GET") return Response.json({ data: saved }, { headers: { etag: '"youtrack:3"' } });
      if (path.endsWith("/disconnect")) {
        if (disconnectFailure) return Response.json({ error: { code: "SERVICE_UNAVAILABLE" } }, { status: 503 });
        return Response.json({ data: { detachedLinks: 0, configuration: { ...saved, enabled: false, baseUrl: null, tokenConfigured: false, routes: [],
          connection: { status: "unconfigured", checkedAt: null, lastErrorCode: null }, rowVersion: 4 } } }, { headers: { etag: '"youtrack:4"' } });
      }
      if (!path.endsWith("/discovery")) throw new Error("Configuration writes are forbidden in this fixture");
      const ids = body?.projectIds as string[] | undefined;
      if (ids && mode === "credentials") return Response.json({ error: { code: "CREDENTIALS_REQUIRED", message: "private upstream details" } }, { status: 401 });
      if (ids && mode === "failure") return Response.json({ error: { code: "SERVICE_UNAVAILABLE", message: "private upstream details" } }, { status: 503 });
      return Response.json({ data: { baseUrl: saved.baseUrl, projects: saved.routes.filter(route => !ids || ids.includes(route.project.id)).map(route => ({
        ...route.project, stateFields: ids && mode === "ready" ? [{ ...route.workflow.stateField, bundleId: "bundle-1", statuses: route.workflow.statuses }] : [],
      })) } });
    } });
  function Probe() { model = useYouTrackSettings("w", hooksCopy(false), () => {}, canManage); return null; }
  await act(async () => { view = create(<TmsHttpClientProvider client={http}><Probe/></TmsHttpClientProvider>); });
  return { get model() { return model; }, saved, requests, setDisconnectFailure: (value: boolean) => { disconnectFailure = value; }, setMode: (value: typeof mode) => { mode = value; },
    dispose: async () => { await act(async () => view.unmount()); if (originalReact) Object.defineProperty(globalThis, "React", originalReact); else Reflect.deleteProperty(globalThis, "React"); } };
}
