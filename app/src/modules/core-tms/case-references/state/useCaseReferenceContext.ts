"use client";

import { useEffect, useMemo, useState } from "react";
import type { TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import { useOptionalTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { createCaseReferenceResolver, type CaseReferenceResolver } from "../application/caseReferenceResolver";
import { findExactCaseReferences } from "../data/resolveCaseReference";
import type { CaseReferenceScope } from "../domain/caseReference";

export type CaseReferenceContextValue = { scope: CaseReferenceScope; resolver: CaseReferenceResolver };
const EMPTY: readonly TestCaseSummary[] = [];

export function useCaseReferenceContext(scope: CaseReferenceScope, records = EMPTY, projectIds: readonly string[] = []) {
  const client = useOptionalTmsHttpClient();
  const projects = [...new Set(projectIds)].sort().join("\0");
  const configuration = useMemo(() => ({ client, records, projects,
    scope: { workspaceId: scope.workspaceId, projectId: scope.projectId },
  }), [client, scope.workspaceId, scope.projectId, records, projects]);
  const [mounted, setMounted] = useState<{ configuration: typeof configuration; context: CaseReferenceContextValue | null }>();
  useEffect(() => {
    const { client, records, projects, scope } = configuration;
    const context = client ? { scope, resolver: createCaseReferenceResolver(scope, records, projects.split("\0"),
      (projectId, key, signal) => findExactCaseReferences(client, projectId, key, signal)),
    } : null;
    setMounted({ configuration, context });
    return () => { context?.resolver.dispose(); };
  }, [configuration]);
  // Includes React Strict Mode replay: each effect owns a fresh abortable resolver.
  return mounted?.configuration === configuration ? mounted.context : null;
}
