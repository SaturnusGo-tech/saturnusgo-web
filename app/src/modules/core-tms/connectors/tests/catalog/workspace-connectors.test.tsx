import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { WorkspaceConnectorProvider, useWorkspaceConnectors } from "../../application/context/WorkspaceConnectorContext";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { Connection } from "../../model/connector-types";

void test("one catalog controls project-specific Swagger visibility, mutations and stale requests", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.assign(globalThis, { React });
  const pending: { path: string; signal: AbortSignal; resolve: (data: { data: Connection[] }) => void;
    reject: (error: Error) => void }[] = [];
  const http = { get: (path: string, signal: AbortSignal) => new Promise((resolve, reject) =>
    pending.push({ path, signal, resolve, reject })) } as unknown as TmsHttpClient;
  let current!: ReturnType<typeof useWorkspaceConnectors>;
  function Probe() { current = useWorkspaceConnectors(); return null; }
  function Harness({ workspace = "w", project = "p", active = true, capabilities = ["core", "api_testing", "integrations"] }) {
    return <TmsHttpClientProvider client={http}><TmsSessionProvider value={{ kind: "managed", label: "QA",
      subject: "qa", companyCapabilities: capabilities, signOut: async () => {} }}>
      <WorkspaceConnectorProvider workspaceId={workspace} projectId={project} active={active}>
        <Probe /><Probe />
      </WorkspaceConnectorProvider>
    </TmsSessionProvider></TmsHttpClientProvider>;
  }
  const connection = { id: "swagger-w-p", workspaceId: "w", projectId: "p", provider: "swagger", enabled: true } as Connection;
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(<Harness />); });
    assert.equal(pending.length, 1); assert.equal(current.swaggerConnected, false);
    assert.equal(pending[0].path, "/integrations/connectors?workspaceId=w");
    await act(async () => pending[0].resolve({ data: [] }));
    assert.equal(current.swaggerConnected, false);
    await act(async () => current.update({ workspaceId: "w", projectId: "p" }, "swagger", connection));
    assert.equal(current.swaggerConnected, true);
    await act(async () => renderer.update(<Harness project="other" />));
    assert.equal(current.swaggerConnected, false); assert.equal(pending.length, 2);
    await act(async () => renderer.update(<Harness />));
    assert.equal(current.swaggerConnected, true);
    await act(async () => current.update({ workspaceId: "w", projectId: "p" }, "swagger", null));
    assert.equal(current.swaggerConnected, false); assert.equal(pending[1].signal.aborted, true);
    await act(async () => pending[1].resolve({ data: [connection] }));
    assert.equal(current.swaggerConnected, false);
    await act(async () => pending[2].resolve({ data: [{ ...connection, enabled: false }] }));
    assert.equal(current.swaggerConnected, false);
    await act(async () => current.refresh());
    await act(async () => renderer.update(<Harness workspace="new-company" />));
    assert.equal(current.swaggerConnected, false); assert.equal(pending[3].signal.aborted, true);
    await act(async () => pending[3].resolve({ data: [connection] }));
    assert.equal(current.swaggerConnected, false);
    await act(async () => pending[4].reject(new Error("Unavailable")));
    assert.equal(current.state, "error"); assert.equal(current.swaggerConnected, false);
    const requests = pending.length;
    await act(async () => renderer.update(<Harness workspace="new-company" active={false} />));
    assert.equal(current.swaggerConnected, false); assert.equal(pending.length, requests);
    await act(async () => renderer.update(<Harness capabilities={["core"]} />));
    assert.equal(current.swaggerConnected, false); assert.equal(pending.length, requests);
  } finally {
    await act(async () => renderer?.unmount());
    if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React");
  }
});
