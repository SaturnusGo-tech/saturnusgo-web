import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../../auth/presentation/session/TmsSessionContext";
import type { YouTrackConfiguration, YouTrackConfigurationInput } from "../../../model/youtrack-settings";
import { useYouTrackPluginToggle } from "../useYouTrackPluginToggle";
export const configuration = (): YouTrackConfiguration => {
  const workflow = { stateField: { id: "field-state", name: "State" },
    statuses: ["open", "test", "done"].map((id, ordinal) => ({ id, name: id, localizedName: null, ordinal, isResolved: id === "done", archived: false })),
    inbound: { backlog: ["open"], inProgress: [], readyForRetest: ["test"], accepted: ["done"] },
    outbound: { open: "open", triaged: null, inProgress: null, readyForRetest: "test", verified: "done", closed: "done", reopened: "open" } };
  return { workspaceId: "w", enabled: true, source: "workspace", configurationVersion: 2,
    baseUrl: "https://youtrack.example/youtrack/", tokenConfigured: true, targets: { android: null, ios: null, backend: null },
    readyForTestStatuses: [], acceptedStage: null, connectionRevision: 5, rowVersion: 3,
    connection: { status: "connected", checkedAt: null, lastErrorCode: null },
    routes: [{ id: "default", name: "Main", enabled: true, isDefault: true, match: null,
      project: { id: "main-project", name: "Main project", shortName: "MAIN" }, workflow },
    { id: "web-rule", name: "Web", enabled: true, isDefault: false, match: { field: "component", value: "Web" },
      project: { id: "web-project", name: "Web project", shortName: "WEB" }, workflow: structuredClone(workflow) }] };
};
export function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject };
}
export type Resource = { data: YouTrackConfiguration; etag: string | null };
type Save = { path: string; body: YouTrackConfigurationInput; method: string; options: { signal: AbortSignal; ifMatch: string } };
export async function toggleHarness(options: { load?: (path: string, signal: AbortSignal) => Promise<Resource>; save?: (input: Save) => Promise<Resource> } = {}) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const reads: { path: string; signal: AbortSignal }[] = [], writes: Save[] = [], updates: YouTrackConfiguration[] = [];
  let server = configuration(), current!: ReturnType<typeof useYouTrackPluginToggle>, renderer!: ReactTestRenderer;
  let props = { workspaceId: "w", enabled: true, subject: "qa-one" };
  const client = () => ({ getResource: async (path: string, signal: AbortSignal) => {
    reads.push({ path, signal }); return options.load ? options.load(path, signal) : { data: server, etag: '"v3"' };
  }, mutateResource: async (path: string, method: string, body: Save["body"], input: Save["options"]) => {
    const call = { path, method, body, options: input }; writes.push(call);
    const result = options.save ? await options.save(call) : { data: { ...server, enabled: body.enabled, rowVersion: 4 }, etag: '"v4"' };
    server = result.data; return result;
  } }) as unknown as TmsHttpClient;
  let http = client();
  function Probe() { current = useYouTrackPluginToggle({ ...props, onUpdated: value => updates.push(value) }); return null; }
  function App() { return <TmsHttpClientProvider client={http}><TmsSessionProvider value={{ kind: "managed", label: "QA", subject: props.subject,
    companyCapabilities: ["core", "integrations"], signOut: async () => {} }}><Probe /></TmsSessionProvider></TmsHttpClientProvider>; }
  await act(async () => { renderer = create(<App />); });
  return { get current() { return current; }, reads, writes, updates,
    rerender: async (next: Partial<typeof props>, replaceHttp = false) => { props = { ...props, ...next }; if (replaceHttp) http = client(); await act(async () => renderer.update(<App />)); },
    dispose: async () => { await act(async () => renderer.unmount()); if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React"); },
  };
}
