import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { createWorkspaceRequests } from "../../../../state/workspace/requests/workspace-requests";
import type { RepositoryFolder } from "../../../model/folder";
import type { useWorkspaceFolders } from "../useWorkspaceFolders";

export const folder = { id: "folder-a", path: "/A", name: "A", etag: '"folder-a:1"' } as RepositoryFolder;
type Write = { key: string; args: unknown[]; resolve: (value: unknown) => void; reject: (error: Error) => void };
type Effect = { dependencies: unknown[]; cleanup?: () => void };

export function folderHarness() {
  const requests = createWorkspaceRequests();
  const writes: Write[] = [];
  const refreshes: { resolve: (value: unknown) => void }[] = [];
  const slots: unknown[] = [];
  const effects: (() => void)[] = [];
  let cursor = 0;
  let reloads = 0;
  const state = {
    data: { workspace: { id: "workspace-a" }, meta: { authorization: { capabilities: ["test_case:manage"] } } },
    connection: "connected", view: "cases", selectedFolder: "/A",
    setSelectedFolder: (_value: string) => undefined,
    captureProjectNavigationGuard: requests.captureNavigationGuard,
    refreshProject: () => new Promise((resolve) => refreshes.push({ resolve })),
  };
  const derived = { project: { id: "project-a" }, projectCases: [] as { id: string; etag: string; archivedAt?: string }[] };
  const module = { exports: {} as { useWorkspaceFolders: typeof useWorkspaceFolders } };
  const source = readFileSync(new URL("../useWorkspaceFolders.ts", import.meta.url), "utf8");
  const write = (...args: unknown[]) => new Promise((resolve, reject) => writes.push({ args, key: String(args[args.length - 1]), resolve, reject }));
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, {
    module, exports: module.exports, crypto, Error,
    require(name: string) {
      if (name === "react") return {
        useRef(current: unknown) { const index = cursor++; return slots[index] ?? (slots[index] = { current }); },
        useState(initial: unknown) {
          const index = cursor++; if (!(index in slots)) slots[index] = initial;
          return [slots[index], (next: unknown) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
        },
        useEffect(effect: () => (() => void) | undefined, dependencies: unknown[]) {
          const index = cursor++;
          const previous = slots[index] as Effect | undefined;
          if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
            effects.push(() => { previous?.cleanup?.(); slots[index] = { dependencies, cleanup: effect() }; });
          }
        },
      };
      if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
      if (name.endsWith("transport/http")) return { TmsApiError };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
      if (name.endsWith("useFolderQuery")) return { useFolderQuery: () => ({ items: [folder], loading: false, error: "", reload: () => { reloads++; } }) };
      if (name.endsWith("folder-api")) return { createFolder: write, changeFolder: write, transitionFolder: write, moveFolderCases: write, archiveFolderCases: write };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  function render() {
    cursor = 0;
    const result = module.exports.useWorkspaceFolders(state as unknown as Parameters<typeof useWorkspaceFolders>[0], derived as unknown as Parameters<typeof useWorkspaceFolders>[1]);
    effects.splice(0).forEach((effect) => effect());
    return result;
  }
  return { requests, writes, refreshes, state, derived, render, reloads: () => reloads,
    unmount: () => slots.forEach((slot) => (slot as Effect | undefined)?.cleanup?.()) };
}
