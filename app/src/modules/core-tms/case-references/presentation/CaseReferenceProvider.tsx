"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import type { CaseReferenceScope } from "../domain/caseReference";
import { useCaseReferenceContext, type CaseReferenceContextValue } from "../state/useCaseReferenceContext";

const CaseReferenceContext = createContext<CaseReferenceContextValue | null>(null);

export function CaseReferenceProvider({ scope, records, projectIds, children }: {
  scope: CaseReferenceScope; records?: readonly TestCaseSummary[]; projectIds?: readonly string[]; children: ReactNode;
}) {
  const context = useCaseReferenceContext(scope, records, projectIds);
  return <CaseReferenceContext.Provider value={context}>{children}</CaseReferenceContext.Provider>;
}

export const useCaseReferences = () => useContext(CaseReferenceContext);

export function useCaseReference(key: string | null) {
  const context = useCaseReferences();
  const [loaded, setLoaded] = useState<{ context: CaseReferenceContextValue; key: string;
    value: Awaited<ReturnType<CaseReferenceContextValue["resolver"]["resolve"]>> }>();
  useEffect(() => {
    if (!key || !context) return;
    let active = true;
    void context.resolver.resolve(key).then(value => { if (active) setLoaded({ context, key, value }); });
    return () => { active = false; };
  }, [context, key]);
  const value = key && context ? context.resolver.peek(key) : null;
  return { scope: context?.scope, reference: value ?? (loaded?.context === context && loaded?.key === key ? loaded.value : null) };
}
