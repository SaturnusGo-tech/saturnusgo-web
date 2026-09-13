import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { useApiSourceList } from "../../state/useApiSourceList";
import { useApiSelection } from "../../selection/useApiSelection";
import { useApiDocument } from "../../state/useApiDocument";
import type { ApiSource } from "../../model/api-source";
import { workspaceViewAllowed } from "../../../auth/managed/domain/features/workspace-view-access";
void test("project switching cancels stale documents, keeps a shared API and clears inaccessible content", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const pending: { path: string; signal: AbortSignal; resolve: (data: unknown) => void; reject: (error: Error) => void }[] = [];
  const http = { get: (path: string, signal: AbortSignal) => new Promise((resolve, reject) => pending.push({ path, signal, resolve, reject })) } as unknown as TmsHttpClient;
  let state!: ReturnType<typeof useApiSourceList>; let selection!: ReturnType<typeof useApiSelection>; let document!: ReturnType<typeof useApiDocument>;
  const source = { id: "shared", rowVersion: 1, enabled: true } as ApiSource;
  function Probe({ project }: { project: string }) {
    state = useApiSourceList("w", { projectIds: [project] });
    selection = useApiSelection("w", project, state.items, state.loading);
    document = useApiDocument("w", { projectIds: [project] }, selection.source); return null;
  }
  const element = (project: string) => <TmsHttpClientProvider client={http}><Probe project={project}/></TmsHttpClientProvider>;
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(element("a")); });
    await act(async () => pending[0].resolve({ data: [source], nextCursor: null }));
    assert.equal(selection.source?.id, "shared"); assert.ok(pending[1].path.includes("/shared/specification"));
    await act(async () => renderer.update(element("b"))); assert.equal(pending[1].signal.aborted, true); assert.equal(document.document, null);
    await act(async () => pending[1].resolve({ data: { title: "Stale" } })); assert.equal(document.document, null);
    await act(async () => pending[2].resolve({ data: [source, { ...source, id: "other" }], nextCursor: null }));
    assert.equal(selection.source?.id, "shared");
    await act(async () => pending[3].resolve({ data: { title: "Current" } })); assert.equal((document as ReturnType<typeof useApiDocument>).document?.title, "Current");
    await act(async () => renderer.update(element("empty")));
    await act(async () => pending[4].resolve({ data: [], nextCursor: null }));
    assert.equal(selection.source, null); assert.equal(document.document, null);
    await act(async () => renderer.update(element("broken")));
    await act(async () => pending[5].reject(new Error("Unavailable"))); assert.ok(state.error); assert.equal(selection.source, null);
  } finally { await act(async () => renderer?.unmount()); if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React"); }
});
test("only administrators and QA managers see hooks; API reading remains available to testers and observers", () => {
  for (const role of ["workspace_admin", "qa_manager", "tester", "viewer"]) {
    const caps = ["integration:read", ...(["workspace_admin", "qa_manager"].includes(role) ? ["integration:manage"] : [])];
    assert.equal(workspaceViewAllowed("hooks", caps), ["workspace_admin", "qa_manager"].includes(role));
    assert.equal(workspaceViewAllowed("api", caps), true);
  }
  assert.equal(workspaceViewAllowed("api", []), false);
});
