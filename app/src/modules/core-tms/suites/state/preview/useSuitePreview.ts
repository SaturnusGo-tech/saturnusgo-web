import { useEffect, useMemo, useState } from "react";
import type { Suite, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useWorkspacePeople } from "../../../workspace/members/context/WorkspacePeopleContext";
import { matchesSuite } from "../../../helpers/suites/matchesSuite";
import { loadSuiteTextMatches } from "../../data/preview/suite-text-preview";

type Membership = Pick<Suite, "projectId" | "type" | "caseIds" | "filter">;
type Lookup = { key: string; ids: ReadonlySet<string>; loading: boolean; error: boolean };
export function useSuitePreview(cases: TestCaseSummary[], suite: Membership | null, folders: readonly RepositoryFolder[]) {
  const http = useTmsHttpClient(); const people = useWorkspacePeople();
  const text = suite?.type === "dynamic" ? suite.filter.text?.trim() ?? "" : "";
  const projectId = suite?.projectId ?? ""; const key = `${people.workspaceId}:${projectId}:${text}`;
  const [lookup, setLookup] = useState<Lookup>({ key: "", ids: new Set(), loading: false, error: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!text || !projectId) return;
    const controller = new AbortController();
    setLookup({ key, ids: new Set(), loading: true, error: false });
    if (people.offline) { setLookup({ key, ids: new Set(), loading: false, error: true }); return; }
    loadSuiteTextMatches(http, projectId, text, controller.signal).then(ids => {
      if (!controller.signal.aborted) setLookup({ key, ids, loading: false, error: false });
    }).catch(() => { if (!controller.signal.aborted) setLookup({ key, ids: new Set(), loading: false, error: true }); });
    return () => controller.abort();
  }, [http, key, text, projectId, attempt, people.offline]);
  const values = useMemo(() => suite ? cases.filter(item => matchesSuite(item, suite, folders, lookup.key === key ? lookup.ids : undefined)) : [], [cases, suite, folders, lookup, key]);
  return { cases: values, loading: Boolean(text && (lookup.key !== key || lookup.loading)), error: Boolean(text && lookup.key === key && lookup.error), retry: () => setAttempt(value => value + 1) };
}
