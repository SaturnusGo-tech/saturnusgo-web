import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TdmWorkspaceProvider } from "../../../composition/TdmWorkspaceProvider";
import { useTestData } from "../../../application/context/TestDataContext";
let observed: Array<{ actor: string; read: boolean }> = [];
function Observe() { const feature = useTestData(); observed.push({ actor: feature?.actorId ?? "none", read: Boolean(feature?.permissions.read) }); return null; }
test("switching actor invalidates configuration immediately and never reuses the previous actor permissions", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React }); observed = [];
  const requests: Array<{ signal: AbortSignal; resolve(value: unknown): void }> = [];
  const http = { getResource: (_path: string, signal: AbortSignal) => new Promise(resolve => requests.push({ signal, resolve })) } as unknown as TmsHttpClient;
  const environment = [] as const;
  const tree = (actorId: string) => <TmsHttpClientProvider client={http}><TdmWorkspaceProvider workspaceId="workspace" projectId="project" actorId={actorId} active environments={environment}><Observe /></TdmWorkspaceProvider></TmsHttpClientProvider>;
  let view: ReturnType<typeof create>;
  const configuration = (permissions: string[]) => ({ data: { enabled: true, credentialsAvailable: false, revealVerificationAvailable: false, permissions, limits: {} } });
  try {
    await act(async () => { view = create(tree("admin")); });
    await act(async () => requests[0].resolve(configuration(["test_data:read"])));
    assert.ok(observed.some(value => value.actor === "admin" && value.read));
    await act(async () => { view!.update(tree("viewer")); });
    assert.equal(requests.length, 2, "actor change must fetch effective permissions again");
    assert.equal(requests[0].signal.aborted, true);
    assert.equal(observed.some(value => value.actor === "viewer" && value.read), false);
    await act(async () => requests[1].resolve(configuration([])));
    assert.equal(observed[observed.length - 1]?.read, false);
  } finally {
    await act(async () => view!.unmount());
    if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React");
  }
});
