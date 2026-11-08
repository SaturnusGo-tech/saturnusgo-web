import { useMemo } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getTestCase } from "../../../test-cases/data/test-case-api";
import { useProductDocResource } from "../useProductDocResource";

export function useProductDocCase(caseId: string, projectId: string) {
  const client = useTmsHttpClient();
  const request = useMemo(() => async (signal: AbortSignal) => {
    const result = await getTestCase(client, caseId, signal);
    if (result.data.projectId !== projectId) throw new Error("Case belongs to another project.");
    return result;
  }, [client, caseId, projectId]);
  return useProductDocResource(request);
}
