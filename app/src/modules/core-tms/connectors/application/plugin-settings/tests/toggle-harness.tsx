import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../../auth/presentation/session/TmsSessionContext";
import { WorkspaceConnectorProvider, useWorkspaceConnectors } from "../../context/WorkspaceConnectorContext";
import { connectionDraft } from "../../../model/connector-draft";
import type { Connection, ConnectionInput } from "../../../model/connector-types";
import { usePluginConnectionToggle } from "../usePluginConnectionToggle";

export const connection = (workspaceId = "w", projectId = "p"): Connection => ({
  id: "connection", workspaceId, projectId, provider: "linear", enabled: true, rowVersion: 3,
  checkedAt: "2026-11-01T00:00:00Z", credentialsConfigured: true, webhookConfigured: true,
  settings: { ...connectionDraft("linear", null).settings, baseUrl: "https://linear.app", remoteId: "team", destinationId: "bugs",
    inboundReadyStatuses: ["fixed"], outboundStatuses: { open: "triage" }, rules: [] },
});
export function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject };
}
type Resource = { data: Connection | null; etag: string | null };
type Save = { path: string; body: ConnectionInput; options: { signal: AbortSignal; ifMatch: string } };
export async function toggleHarness(options: {
  load?: (path: string, signal: AbortSignal) => Promise<Resource>;
  save?: (input: Save) => Promise<Resource>;
} = {}) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const reads: { path: string; signal: AbortSignal }[] = [], writes: Save[] = [], updates: Connection[] = [];
  let server = connection(), current!: ReturnType<typeof usePluginConnectionToggle>;
  let catalog!: ReturnType<typeof useWorkspaceConnectors>, renderer!: ReactTestRenderer;
  let props = { workspaceId: "w", projectId: "p", enabled: true, subject: "qa-1" };
  const http = { get: async () => ({ data: [server] }), getResource: async (path: string, signal: AbortSignal) => {
    reads.push({ path, signal }); return options.load ? options.load(path, signal) : { data: server, etag: '"v3"' };
  }, mutateResource: async (path: string, _method: string, body: ConnectionInput, input: Save["options"]) => {
    const call = { path, body, options: input }; writes.push(call);
    const result = options.save ? await options.save(call) : { data: { ...server, enabled: body.enabled, rowVersion: 4 }, etag: '"v4"' };
    if (result.data) server = result.data; return result;
  } } as unknown as TmsHttpClient;
  function Probe() { current = usePluginConnectionToggle({ ...props, onUpdated: (_provider, value) => updates.push(value) }); catalog = useWorkspaceConnectors(); return null; }
  function App() { return <TmsHttpClientProvider client={http}><TmsSessionProvider value={{ kind: "managed", label: "QA", subject: props.subject,
    companyCapabilities: ["core", "integrations"], signOut: async () => {} }}><WorkspaceConnectorProvider workspaceId={props.workspaceId} projectId={props.projectId} active>
    <Probe /></WorkspaceConnectorProvider></TmsSessionProvider></TmsHttpClientProvider>; }
  await act(async () => { renderer = create(<App />); });
  return { get current() { return current; }, get catalog() { return catalog; }, reads, writes, updates,
    rerender: async (next: Partial<typeof props>) => { props = { ...props, ...next }; await act(async () => renderer.update(<App />)); },
    dispose: async () => { await act(async () => renderer.unmount()); if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React"); },
  };
}
