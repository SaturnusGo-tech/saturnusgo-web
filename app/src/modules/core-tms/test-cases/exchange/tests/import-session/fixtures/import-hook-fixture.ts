import { createElement } from "react";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../../../auth/http/TmsHttpClientContext";
import { useImportCases } from "../../../state/import/use-import-cases";
import type { RepositoryFolder } from "../../../../../folders/model/folder";

(globalThis as unknown as { React: typeof React }).React = React;
export const project = (id: string) => ({ id, key: id.toUpperCase(), name: `Project ${id}` }) as Project;
const content = { title: "Prepared case", description: "", preconditions: "", testData: "", component: "", type: "manual", lifecycle: "draft", priority: "medium", tags: [], estimatedMinutes: null, steps: [], checklist: [] };
export function nativeFile(cases = ["First"], folders: string[] = []) {
  return new File([JSON.stringify({ schemaVersion: "saturnusgo.tms.test-cases.v2", project: { key: "SOURCE", name: "Source" },
    exportedAt: "2026-11-12", folders, testCases: cases.map(title => ({ title })) })], "native.json");
}
export async function importHookFixture(options: { delayedNormalization?: boolean; delayedTargets?: boolean; failCaseOnce?: boolean; initialFolder?: RepositoryFolder; stopAfterFirstCase?: boolean } = {}) {
  let state!: ReturnType<typeof useImportCases>; let view!: ReactTestRenderer;
  let props = { project: project("p"), workspaceId: "w", folders: options.initialFolder ? [options.initialFolder] : [] as RepositoryFolder[], initialFolderId: options.initialFolder?.id ?? null };
  let inspected = 0, normalized = 0; let releaseNormalization: (() => void) | undefined;
  let started!: () => void; const normalizationStarted = new Promise<void>(resolve => { started = resolve; });
  const sourceSaves: { file: File; projectId: string; folderId: string | null }[] = [];
  const writes: { path: string; body: any; key?: string }[] = [];
  const targetRequests: { path: string; signal: AbortSignal; resolve(value: unknown): void }[] = [];
  const normalizedHints: string[][] = [], refreshed: (string | undefined)[] = [];
  const http = { get: async (path: string, signal: AbortSignal) => {
    if (options.delayedTargets) return new Promise(resolve => targetRequests.push({ path, signal, resolve }));
    return { data: [], meta: { nextCursor: null } };
  }, mutate: async (path: string, _method: string, body: any) => {
    if (path.endsWith("inspect")) { inspected++; return { records: [{ path: "/0", value: {}, context: [] }] }; }
    normalized++; normalizedHints.push(body.folders); started();
    if (options.delayedNormalization && normalized === 1) await new Promise<void>(resolve => { releaseNormalization = resolve; });
    return { cases: [{ sourcePath: "/0", folderPath: "/", content, warnings: [] }], issues: [] };
  }, mutateResource: async (path: string, _method: string, body: any, request: { idempotencyKey?: string }) => {
    writes.push({ path, body, key: request.idempotencyKey });
    if (options.stopAfterFirstCase && path === "/test-cases" && writes.length === 1) state.stop();
    if (options.failCaseOnce && writes.length === 2) throw new Error("Temporary case failure");
    if (path.endsWith("folders")) return { data: { id: "created", workspaceId: props.workspaceId,
      projectId: /projects\/([^/]+)/.exec(path)?.[1], path: `/${body.name}`, archivedAt: null }, etag: "1" };
    return { data: {}, etag: "1" };
  } } as unknown as TmsHttpClient;
  function Probe() {
    state = useImportCases({ ...props, locale: "en", onImported: async id => { refreshed.push(id); },
      saveSource: async (file, scope, folderId) => { sourceSaves.push({ file, projectId: scope.projectId, folderId }); } });
    return null;
  }
  const render = () => createElement(TmsHttpClientProvider, { client: http, children: createElement(Probe) }) as unknown as Parameters<typeof create>[0];
  await act(async () => { view = create(render()); });
  return { state: () => state, sourceSaves, writes, targetRequests, normalizedHints, refreshed, normalizationStarted,
    counts: () => ({ inspected, normalized }), releaseNormalization: () => releaseNormalization?.(),
    update: async (next: Partial<typeof props>) => { props = { ...props, ...next }; await act(async () => view.update(render())); },
    close: () => act(() => view.unmount()) };
}
