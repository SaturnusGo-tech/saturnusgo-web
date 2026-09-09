import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

type Element = { type: string; props: Record<string, unknown> };
export function elements(node: unknown, type: string): Element[] {
  if (Array.isArray(node)) return node.flatMap((child) => elements(child, type));
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const item = node as Element;
  return [...(item.type === type ? [item] : []), ...elements(item.props.children, type)];
}

export function treeControl(path: string, exportName: string) {
  const dragStates: boolean[] = [];
  const dropStates: boolean[] = [];
  const module = { exports: {} as Record<string, (props: unknown) => unknown> };
  const source = readFileSync(new URL(`../../presentation/${path}`, import.meta.url), "utf8");
  const jsx = (type: string, props: Record<string, unknown>) => ({ type, props });
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module, exports: module.exports,
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name.endsWith("useDisclosureMotion")) return { useDisclosureMotion: (open: boolean) => ({ ref: { current: null }, present: open }) };
      if (name === "react") return { useRef: (current: unknown) => ({ current }), useContext: () => ({ current: 0 }) };
      if (name === "@dnd-kit/core") return {
        useDraggable({ disabled }: { disabled: boolean }) {
          dragStates.push(disabled);
          return { attributes: { "aria-disabled": disabled }, listeners: {}, setNodeRef() {}, isDragging: false };
        },
        useDroppable({ disabled }: { disabled: boolean }) { dropStates.push(disabled); return { setNodeRef() {}, isOver: false }; },
      };
      if (name === "react-icons/pi") return new Proxy({}, { get: () => "Icon" });
      if (name.endsWith("RepositoryCaseLeaf")) return { RepositoryCaseLeaf: "CaseLeaf" };
      if (name.endsWith("drag-click")) return { DragClickContext: {} };
      if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_target, key) => key }) };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return { render: module.exports[exportName], dragStates, dropStates };
}
