import { useEffect, useRef, useState } from "react";
import type { TestCaseRevision } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { SharedStep } from "../../../../../shared-steps/model/shared-step";
import { insertSharedStepAfter } from "./insert-shared-step";

export function useSharedStepInsertion(revision: TestCaseRevision, resolve: (id: string) => Promise<SharedStep | null>,
  patch: (next: Partial<TestCaseRevision>) => void, editing = true, pendingStepIds: ReadonlySet<string> = new Set()) {
  const allowed = editing && revision.type !== "checklist";
  const latest = useRef({ revision, patch, allowed, pendingStepIds });
  latest.current = { revision, patch, allowed, pendingStepIds };
  const sequence = useRef(0);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => () => { sequence.current++; }, []);
  useEffect(() => { if (!allowed) { sequence.current++; setPending(false); setError(false); } }, [allowed]);
  async function insert(index: number, id: string) {
    if (!latest.current.allowed) return;
    const token = ++sequence.current;
    const anchorId = latest.current.revision.steps[index]?.id;
    setPending(true); setError(false);
    try {
      const value = await resolve(id);
      if (token !== sequence.current || !latest.current.allowed) return;
      if (!value || value.archivedAt) { setError(true); return; }
      const steps = latest.current.revision.steps;
      const target = index < 0 ? -1 : steps.findIndex(step => step.id === anchorId);
      if (index >= 0 && target < 0) { setError(true); return; }
      const snapshot = { id: value.id, title: value.current.title, revision: value.currentRevision,
        items: value.current.items.map(item => ({ ...item, attachmentIds: [...item.attachmentIds] })) };
      latest.current.patch({ steps: insertSharedStepAfter(steps, target, snapshot, latest.current.pendingStepIds) });
    } catch { if (token === sequence.current) setError(true); }
    finally { if (token === sequence.current) setPending(false); }
  }
  return { insert, pending, error };
}
