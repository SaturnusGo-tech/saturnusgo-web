import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { WorkspaceConnectorProvider, useWorkspaceConnectors } from "../../application/context/WorkspaceConnectorContext";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { Connection } from "../../model/connector-types";
void test("connector catalog is workspace-owned; project switches and API-only access never read legacy Swagger", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const pending: { path: string; signal: AbortSignal; resolve: (data: { data: Connection[] }) => void }[] = [];
  const http = { get: (path: string, signal: AbortSignal) => new Promise(resolve => pending.push({ path, signal, resolve })),
    getResource: () => { throw new Error("Legacy Swagger configuration must not be requested"); } } as unknown as TmsHttpClient;
  let current!: ReturnType<typeof useWorkspaceConnectors>;
  function Probe() { current = useWorkspaceConnectors(); return null; }
  function Harness({ workspace = "w", project = "p", capabilities = ["core", "api_testing", "integrations"] }) {
    return <TmsHttpClientProvider client={http}><TmsSessionProvider value={{ kind: "managed", label: "QA", subject: "qa", companyCapabilities: capabilities, signOut: async () => {} }}>
      <WorkspaceConnectorProvider workspaceId={workspace} projectId={project} active><Probe/></WorkspaceConnectorProvider>
    </TmsSessionProvider></TmsHttpClientProvider>;
  }
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(<Harness/>); });
    assert.equal(pending.length, 1); assert.equal(pending[0].path, "/integrations/connectors?workspaceId=w");
    await act(async () => pending[0].resolve({ data: [] })); assert.equal(current.state, "ready");
    await act(async () => renderer.update(<Harness project="other"/>)); assert.equal(pending.length, 1);
    await act(async () => current.refresh());
    await act(async () => renderer.update(<Harness workspace="new"/>)); assert.equal(pending[1].signal.aborted, true);
    await act(async () => pending[1].resolve({ data: [{ id: "stale" } as Connection] })); assert.deepEqual(current.connections, []);
    await act(async () => renderer.update(<Harness capabilities={["core", "api_testing"]}/>));
    assert.equal(pending[2].signal.aborted, true); assert.equal(pending.length, 3); assert.deepEqual(current.connections, []);
  } finally { await act(async () => renderer?.unmount()); if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React"); }
});
