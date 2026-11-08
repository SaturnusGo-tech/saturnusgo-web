"use client";

import { readOnly$, useCellValue, useLexicalNodeRemove, useMdastNodeUpdater, type DirectiveDescriptor } from "@mdxeditor/editor";
import type { LeafDirective } from "mdast-util-directive";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { RunEvidenceQuery } from "../../../domain/run/productDocRunCandidates";
import { useProductDocRunGateway } from "../../../state/run/useProductDocRunGateway";
import { ProductDocEmbedContext } from "../../embeds/context/productDocEmbedContext";
import { insertEmbedDirective, useEmbedPicker, type EmbedInsertionTarget } from "../../embeds/editor/embedInsertion";
import { ProductDocRunEvidence } from "../card/ProductDocRunEvidence";
import { readRunEmbedPlacement, runDirectiveName, runEmbedPlacementAttributes, type RunEmbedPlacement } from "../markdown/runDirective";
import { RunEvidenceDrawer } from "./drawer/RunEvidenceDrawer";
import { RunEvidencePicker } from "./picker/RunEvidencePicker";
import { useRunEmbedCompose } from "./useRunEmbedCompose";

export const productDocRunDescriptor: DirectiveDescriptor<LeafDirective> = {
  name: runDirectiveName,
  attributes: ["snapshot", "width", "align"],
  hasChildren: false,
  type: "leafDirective",
  testNode: (node) => node.type === "leafDirective" && node.name === runDirectiveName,
  Editor: function RunEvidenceBlock({ mdastNode, lexicalNode, parentEditor }) {
    const readOnly = useCellValue(readOnly$);
    const remove = useLexicalNodeRemove();
    const update = useMdastNodeUpdater<LeafDirective>();
    const compose = useRunEmbedCompose(parentEditor, lexicalNode.getKey());
    const changePlacement = (placement: RunEmbedPlacement) => update({ attributes: runEmbedPlacementAttributes(mdastNode.attributes, placement) });
    return <ProductDocRunEvidence snapshotId={mdastNode.attributes?.snapshot ?? ""}
      placement={readRunEmbedPlacement(mdastNode.attributes)} onRemove={readOnly ? undefined : remove}
      onPlacementChange={readOnly ? undefined : changePlacement} onCompose={readOnly ? undefined : compose} />;
  },
};

const OpenPicker = createContext<((target: EmbedInsertionTarget) => void) | null>(null);

export function useRunEvidencePicker() {
  return useEmbedPicker(useContext(OpenPicker));
}

export function RunEvidencePickerProvider({ children }: { children: ReactNode }) {
  const scope = useContext(ProductDocEmbedContext);
  const gateway = useProductDocRunGateway();
  const load = useCallback((query: RunEvidenceQuery, cursor: string | null, signal: AbortSignal) => {
    if (!scope || !gateway) throw new Error("Run evidence is unavailable");
    return gateway.list(scope, query, cursor, signal);
  }, [scope, gateway]);
  const [target, setTarget] = useState<EmbedInsertionTarget | null>(null);
  const activeTarget = useRef<EmbedInsertionTarget | null>(null);
  const open = (next: EmbedInsertionTarget) => {
    activeTarget.current = next;
    setTarget(next);
  };
  const close = () => {
    activeTarget.current = null;
    setTarget(null);
  };

  return <OpenPicker.Provider value={scope && gateway ? open : null}>
    {children}
    {scope && gateway && <RunEvidenceDrawer open={Boolean(target)} onClose={close}>
      <RunEvidencePicker key={scope.docId} scope={scope} load={load}
        capture={(input, signal) => gateway.capture(scope, input, signal)} onChoose={(snapshot) => {
          if (!target || activeTarget.current !== target) return;
          insertEmbedDirective(target, runDirectiveName, snapshot);
          close();
        }} />
    </RunEvidenceDrawer>}
  </OpenPicker.Provider>;
}
