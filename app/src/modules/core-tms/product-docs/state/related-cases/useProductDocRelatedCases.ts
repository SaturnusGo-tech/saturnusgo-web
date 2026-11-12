"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductDocCase, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocRelatedCaseSelection } from "../../domain/related-cases/product-doc-related-cases";
import { loadRelatedCases } from "../../data/related-cases/load-related-cases";
import { saveRelatedCases } from "../../requirements/related-cases/save-related-cases";
import { subscribeCaseRequirementsChanged } from "../../requirements/save/case-requirements-events";
import { useProductDocResource } from "../useProductDocResource";

type Outcome = { data: ProductDocCase[] } | { error: unknown };
type Reconciliation = { target: object; epoch: number; outcome?: Outcome };

export function useProductDocRelatedCases(api: ProductDocsApi, scope: ProductDocScope, docId: string, draftVersion?: number) {
  const { workspaceId, projectId } = scope;
  const [epoch, setEpoch] = useState(0), [busyFor, setBusyFor] = useState<object>(), [failedFor, setFailedFor] = useState<object>();
  const draft = draftVersion !== undefined;
  const target = useMemo(() => ({}), [api, workspaceId, projectId, docId, draft]);
  const saving = useRef<object | undefined>(undefined), reconciling = useRef<Reconciliation | undefined>(undefined), mounted = useRef(true), activeTarget = useRef(target);
  activeTarget.current = target;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const request = useMemo(() => (signal: AbortSignal) => {
    function settle(outcome: Outcome) {
      const pending = reconciling.current;
      if (!signal.aborted && mounted.current && pending?.target === target && epoch >= pending.epoch) pending.outcome = outcome;
    }
    return loadRelatedCases(api, { workspaceId, projectId }, docId, signal, draftVersion).then(
      data => { settle({ data }); return data; }, error => { settle({ error }); throw error; },
    );
  }, [api, workspaceId, projectId, docId, draftVersion, epoch, target]);
  const resource = useProductDocResource(request, target);
  const data = resource.status === "ready" ? resource.data : undefined;
  const error = resource.status === "error" ? resource.error : undefined;
  useEffect(() => {
    const pending = reconciling.current;
    if (pending?.target !== target || !pending.outcome) return;
    const adopted = "data" in pending.outcome ? resource.status === "ready" && data === pending.outcome.data
      : resource.status === "error" && error === pending.outcome.error;
    if (adopted) { reconciling.current = undefined; setBusyFor(undefined); }
  }, [resource.status, data, error, target]);
  useEffect(() => subscribeCaseRequirementsChanged(changed => {
    if (changed.workspaceId === workspaceId && changed.projectId === projectId && saving.current !== target) setEpoch(value => value + 1);
  }), [workspaceId, projectId, target]);
  async function save(selection: ProductDocRelatedCaseSelection) {
    const current = () => mounted.current && activeTarget.current === target;
    if (!current() || resource.status !== "ready" || saving.current === target || reconciling.current?.target === target) return false;
    saving.current = target;
    setBusyFor(target); setFailedFor(undefined);
    try {
      await saveRelatedCases(api, { workspaceId, projectId }, docId, selection);
      if (current()) setEpoch(value => value + 1);
      return current();
    } catch {
      if (current()) {
        setFailedFor(target);
        reconciling.current = { target, epoch: epoch + 1 };
        setEpoch(value => value + 1);
      }
      return false;
    } finally {
      if (saving.current === target) saving.current = undefined;
      if (current() && reconciling.current?.target !== target) setBusyFor(undefined);
    }
  }
  return { ...resource, busy: busyFor === target, saveFailed: failedFor === target, save };
}
