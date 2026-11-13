import { hookHarness } from "../../../state/navigation/browser/tests/project/hook-harness";
import type { MoveCasesDialog } from "../../presentation/dialog/MoveCasesDialog";
import type { FolderResource } from "../../model/folder";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";
import type { CasesView } from "../../../presentation/cases/CasesView";

type Node = { type: string; props: Record<string, any> };
export function nodes(value: unknown, type: string): Node[] {
  if (Array.isArray(value)) return value.flatMap(child => nodes(child, type));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [...(node.type === type ? [node] : []), ...nodes(node.props.children, type)];
}
export function moveHarness() {
  const h = hookHarness("https://falcon.example/work/?caseId=selected");
  const calls: unknown[] = [];
  const props = { resource: { items: [{ id: "web", path: "/Web", archivedAt: null }], canManage: true, busy: false,
    moveCases: async (...args: unknown[]) => { calls.push(args); return { ok: true }; } } as unknown as FolderResource,
    ids: ["one", "two"], ru: false, onClose: () => calls.push("close"), onMoved: () => calls.push("moved") };
  const proxy = new Proxy({}, { get: (_target, key) => String(key) });
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  const component = h.load<{ MoveCasesDialog: typeof MoveCasesDialog }>(new URL("../../presentation/dialog/MoveCasesDialog.tsx", import.meta.url), name =>
    name === "react/jsx-runtime" ? { jsx, jsxs: jsx } : name.endsWith(".css") ? { default: proxy } : proxy).MoveCasesDialog;
  return { props, calls, render: () => h.settle(() => component(props)), dispose: h.dispose };
}

export function casesMoveHarness(hiddenTree = false) {
  const frames: (() => void)[] = [], focused: string[] = [];
  const h = componentHarness("https://falcon.example/work/", { requestAnimationFrame: (callback: () => void) => { frames.push(callback); return 1; } });
  const control = (name: string, hidden = false) => ({ focus: () => focused.push(name), getClientRects: () => hidden ? [] : [{}] });
  const moveButton = control("move"), treeButton = control("tree", hiddenTree), detail = control("detail");
  const view = { inspectorOpen: true, detailFullscreen: true,
    inspectorResize: { style: {}, overlay: false }, workspaceRef: { current: null as unknown },
    bulkSelection: { selectedIds: ["one", "two"], selected: new Set(["one", "two"]), clear: () => {} } };
  view.bulkSelection.clear = () => { view.bulkSelection.selectedIds = []; };
  view.workspaceRef.current = { querySelector: (selector: string) => {
    if (selector.includes(",")) return treeButton;
    if (selector.includes("data-bulk-move")) return view.bulkSelection.selectedIds.length ? moveButton : null;
    return treeButton;
  } };
  const props = { folders: { busy: false }, testCase: { id: "one" } } as unknown as Parameters<typeof CasesView>[0];
  const proxy = new Proxy({}, { get: (_target, key) => String(key) });
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  const { CasesView: View } = h.load<{ CasesView: typeof CasesView }>(new URL("../../../presentation/cases/CasesView.tsx", import.meta.url), name => {
    if (name.endsWith("useCasesViewController")) return { useCasesViewController: () => view };
    if (name.endsWith("useCaseBrowserFocus")) return { useCaseBrowserFocus: () => () => {} };
    if (name.endsWith("useCasePanelExit")) return { useCasePanelExit: () => (close: () => void) => close() };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", languageTag: "en-US", t: (key: string) => key }) };
    return name === "react/jsx-runtime" ? { jsx, jsxs: jsx } : name.endsWith(".css") ? { default: proxy } : proxy;
  });
  const render = () => {
    const result = h.render(() => View(props));
    const panel = nodes(result, "aside")[0]; if (panel) panel.props.ref.current = detail;
    return result;
  };
  return { render, focused, view, flush: () => { frames.splice(0).forEach(callback => callback()); }, dispose: h.dispose };
}
