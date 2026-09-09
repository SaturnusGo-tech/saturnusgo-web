import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { PointerSensor, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import type { PointerSensorOptions } from "@dnd-kit/core";
import ts from "typescript";
import { dragCaseIds } from "../../../model/tree";
import type { FolderMutationResult, FolderResource, RepositoryFolder } from "../../../model/folder";
import type { RepositoryDragContext } from "../RepositoryDragContext";

type Element = { type: unknown; props: Record<string, unknown> };
type ContextProps = {
  sensors: { sensor: typeof PointerSensor; options: PointerSensorOptions }[];
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
};
export function elements(node: unknown, matches: (element: Element) => boolean): Element[] {
  if (Array.isArray(node)) return node.flatMap((child) => elements(child, matches));
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as Element;
  return [...(matches(element) ? [element] : []), ...elements(element.props.children, matches)];
}
export const folder = (id: string, path: string, parentId: string | null = null): RepositoryFolder => ({
  id, path, parentId, name: path.split("/").slice(-1)[0], workspaceId: "workspace", projectId: "project",
  archivedAt: null, rowVersion: 1, createdAt: "2026-09-09T00:00:00Z", updatedAt: "2026-09-09T00:00:00Z", etag: `"${id}:1"`,
});
export const caseDrag = (caseId: string) => ({ id: `case:${caseId}`, data: { current: { kind: "case", caseId } },
  rect: { current: { initial: null, translated: null } } });
export const folderDrag = (folderId: string, name = folderId) => ({ id: `folder:${folderId}`, data: { current: { kind: "folder", folderId, name } },
  rect: { current: { initial: null, translated: null } } });

export function dragHarness(selected = new Set<string>()) {
  const slots: unknown[] = [];
  let cursor = 0;
  const moves: { ids: readonly string[]; target: string | null; resolve: (result: FolderMutationResult) => void }[] = [];
  const updates: { folder: RepositoryFolder; patch: { parentId?: string | null }; resolve: (result: boolean) => void }[] = [];
  const resource: FolderResource = {
    items: [folder("source", "/Pay"), folder("child", "/Pay/Refunds", "source"), folder("deep", "/Pay/Refunds/Cards", "child"), folder("target", "/Payments")],
    loading: false, busy: false, error: "", canManage: true, reload() {},
    create: async () => null, archive: async () => false, restore: async () => false, archiveCases: async () => ({ ok: true }),
    moveCases: (ids, target) => new Promise((resolve) => moves.push({ ids, target, resolve })),
    update: (item, patch) => new Promise((resolve) => updates.push({ folder: item, patch, resolve })),
  };
  const props = { children: "Repository content", resource, selected, ru: false, locked: false };
  const module = { exports: {} as { RepositoryDragContext: typeof RepositoryDragContext } };
  const jsx = (type: unknown, elementProps: Record<string, unknown>) => ({ type, props: elementProps });
  runInNewContext(ts.transpileModule(readFileSync(new URL("../RepositoryDragContext.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module, exports: module.exports, Date,
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useState(initial: unknown) {
          const index = cursor++; if (!(index in slots)) slots[index] = initial;
          return [slots[index], (next: unknown) => { slots[index] = next; }];
        },
        useRef(current: unknown) { const index = cursor++; return slots[index] ?? (slots[index] = { current }); },
      };
      if (name === "@dnd-kit/core") return { DndContext: "DndContext", DragOverlay: "DragOverlay", PointerSensor,
        useSensor: (sensor: unknown, options: unknown) => ({ sensor, options }), useSensors: (...sensors: unknown[]) => sensors };
      if (name === "react-icons/pi") return { PiFilesDuotone: "FilesIcon" };
      if (name.endsWith("model/tree")) return { dragCaseIds };
      if (name.endsWith("drag-click")) return { DragClickContext: { Provider: "DragClickProvider" } };
      if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_target, key) => key }) };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  function render() { cursor = 0; return module.exports.RepositoryDragContext(props); }
  function context() { return elements(render(), (element) => element.type === "DndContext")[0].props as unknown as ContextProps; }
  function start(active: ReturnType<typeof caseDrag> | ReturnType<typeof folderDrag>) {
    context().onDragStart({ active, activatorEvent: new Event("pointerdown") });
  }
  function drop(active: ReturnType<typeof caseDrag> | ReturnType<typeof folderDrag>, target: string | null | undefined, over = true) {
    context().onDragEnd({ active, activatorEvent: new Event("pointerup"), collisions: null, delta: { x: 0, y: 0 },
      over: over ? { id: "destination", disabled: false, data: { current: { folderId: target } },
        rect: { top: 0, left: 0, right: 100, bottom: 40, width: 100, height: 40 } } : null });
  }
  const preview = () => elements(render(), (element) => element.props.className === "dragPreview");
  const alerts = () => elements(render(), (element) => element.props.role === "alert");
  return { props, moves, updates, render, context, start, drop, preview, alerts,
    suppressUntil: () => (elements(render(), (element) => element.type === "DragClickProvider")[0].props.value as { current: number }).current };
}
