"use client";

import { useLexicalNodeRemove, type DirectiveDescriptor } from "@mdxeditor/editor";
import type { LeafDirective } from "mdast-util-directive";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { insertEmbedDirective, useEmbedPicker, type EmbedInsertionTarget } from "../../embeds/editor/embedInsertion";
import { useProductDocDashboardGateway } from "../../../state/dashboard/useProductDocDashboardGateway";
import { ProductDocDashboard } from "../card/ProductDocDashboard";
import { ProductDocEmbedContext } from "../../embeds/context/productDocEmbedContext";
import { dashboardDirectiveName } from "../markdown/dashboardDirective";
import { DashboardPicker } from "./DashboardPicker";

export const productDocDashboardDescriptor: DirectiveDescriptor<LeafDirective> = {
  name: dashboardDirectiveName,
  attributes: ["snapshot"],
  hasChildren: false,
  type: "leafDirective",
  testNode: (node) => node.type === "leafDirective" && node.name === dashboardDirectiveName,
  Editor: function DashboardBlock({ mdastNode }) {
    const remove = useLexicalNodeRemove();
    return <ProductDocDashboard snapshotId={mdastNode.attributes?.snapshot ?? ""} onRemove={remove} />;
  },
};

const OpenPicker = createContext<((target: EmbedInsertionTarget) => void) | null>(null);

export function useDashboardPicker() {
  return useEmbedPicker(useContext(OpenPicker));
}

export function DashboardPickerProvider({ children }: { children: ReactNode }) {
  const scope = useContext(ProductDocEmbedContext);
  const gateway = useProductDocDashboardGateway();
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const activeTarget = useRef<EmbedInsertionTarget | null>(null);
  const pending = useRef<{ target: EmbedInsertionTarget; snapshot: string } | null>(null);
  const frame = useRef<number | undefined>(undefined);
  useEffect(() => () => { if (frame.current !== undefined) cancelAnimationFrame(frame.current); }, []);
  const open = (next: EmbedInsertionTarget) => {
    if (activeTarget.current) return;
    activeTarget.current = next;
    setPhase("open");
  };
  const close = () => {
    if (pending.current) return;
    activeTarget.current = null;
    setPhase("closing");
  };

  function insert(snapshot: string) {
    const target = activeTarget.current;
    if (!target || pending.current) return;
    pending.current = { target, snapshot };
    setPhase("closing");
  }

  function onExited() {
    const selection = pending.current;
    if (!selection) return;
    pending.current = null;
    frame.current = requestAnimationFrame(() => {
      frame.current = undefined;
      if (activeTarget.current !== selection.target) return;
      activeTarget.current = null;
      insertEmbedDirective(selection.target, dashboardDirectiveName, selection.snapshot);
    });
  }

  return <OpenPicker.Provider value={scope && gateway ? open : null}>
    {children}
    {scope && gateway && <DashboardPicker phase={phase} onExitMotionEnd={() => setPhase("closed")}
      capture={(input, signal) => gateway.capture(scope, input, signal)} onChoose={insert} onClose={close} onExited={onExited} />}
  </OpenPicker.Provider>;
}
