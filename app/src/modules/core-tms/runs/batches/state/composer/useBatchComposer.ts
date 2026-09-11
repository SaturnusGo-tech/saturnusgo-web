import { useEffect, useRef, useState } from "react";
import type { Bootstrap, Project, TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../../../core/tms/idempotency/pending-operation";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { listTestCases } from "../../../../test-cases/data/test-case-api";
import { listFolders } from "../../../../folders/data/folder-api";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { createRunBatch, listRunIterations } from "../../data/batch-api";
import type { RunBatch, RunIteration } from "../../model/batch";

type Catalog = { cases: TestCaseSummary[]; folders: RepositoryFolder[] };
export function useBatchComposer(data: Bootstrap, project: Project, preset: string[], offline: boolean, ru: boolean, presetSuiteId = "") {
  const http = useTmsHttpClient();
  const [suiteId, setSuiteId] = useState(presetSuiteId);
  const [loadFailed, setLoadFailed] = useState(false);
  const [projectIds, setProjectIds] = useState([project.id]);
  const [catalog, setCatalog] = useState<Record<string, Catalog>>({});
  const [caseIds, setCaseIds] = useState(presetSuiteId ? [] : preset);
  const [iterations, setIterations] = useState<RunIteration[]>([]);
  const [iterationId, setIterationId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [build, setBuild] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const operation = useRef<PendingOperation | null>(null);
  const pending = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const ids = projectIds.join("|");
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setLoadFailed(false); setError("");
    if (offline) { setLoadFailed(true); setError(ru ? "Для создания прогона нужно подключение к серверу." : "Connect to the server to create a run."); setLoading(false); return; }
    async function load() {
      try {
        const next: Record<string, Catalog> = {};
        for (const id of projectIds) {
          const [cases, folders] = await Promise.all([listTestCases(http, id, controller.signal),
            listFolders(http, { workspaceId: data.workspace.id, projectId: id }, controller.signal)]);
          controller.signal.throwIfAborted();
          next[id] = { cases: cases.items.filter((c) => !c.archivedAt), folders: folders.filter((f) => !f.archivedAt) };
        }
        const entries = await listRunIterations(http, data.workspace.id, controller.signal);
        controller.signal.throwIfAborted();
        setCatalog((current) => ({ ...current, ...next })); setIterations(entries); setLoading(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadFailed(true); setError(formatTmsMutationFailure(toTmsMutationFailure(error), ru ? "Не удалось загрузить репозиторий." : "Could not load repository.")); setLoading(false);
      }
    }
    void load(); return () => controller.abort();
  }, [http, data.workspace.id, ids, offline, retry]);
  const allCases = Object.values(catalog).flatMap((entry) => entry.cases);
  const visibleCases = projectIds.flatMap((id) => catalog[id]?.cases ?? []);
  async function submit(): Promise<RunBatch | null> {
    if (pending.current || loading || (!caseIds.length && !suiteId) || (!iterationId && !name.trim()) || loadFailed || offline) return null;
    pending.current = true; setBusy(true); setError("");
    const selected = allCases.filter((item) => caseIds.includes(item.id) && (!suiteId || item.projectId !== project.id));
    if (selected.length !== caseIds.length) {
      pending.current = false; setBusy(false);
      setError(ru ? "Часть выбранных кейсов больше недоступна. Обновите выбор перед созданием прогона." : "Some selected cases are no longer available. Update your selection before creating the run.");
      return null;
    }
    const groups = [...new Set([...selected.map((c) => c.projectId), ...(suiteId ? [project.id] : [])])];
    const body = { ...(iterationId ? { iterationId, iteration: null } : { iterationId: null,
      iteration: { name: name.trim(), description, tags: [...new Set(tags.split(",").map((t) => t.trim()).filter(Boolean))] } }),
      selections: groups.map((projectId) => ({ projectId, ...(suiteId && projectId === project.id ? { suiteId, caseIds: [] } : { caseIds: selected.filter((c) => c.projectId === projectId).map((c) => c.id) }) })),
      build, assigneeIdentityId: assignee, type: "ad_hoc" as const };
    operation.current = resolvePendingOperation(operation.current, JSON.stringify(body));
    try { return await createRunBatch(http, data.workspace.id, body, operation.current.key); }
    catch (error) { if (alive.current) setError(formatTmsMutationFailure(toTmsMutationFailure(error), ru ? "Не удалось создать прогон." : "Could not create run.")); return null; }
    finally { pending.current = false; if (alive.current) setBusy(false); }
  }
  return { suiteId, setSuiteId, loadFailed, projectIds, setProjectIds, catalog, caseIds, setCaseIds, iterations, iterationId, setIterationId,
    name, setName, description, setDescription, tags, setTags, assignee, setAssignee, build, setBuild,
    loading, busy, error, reload: () => { setError(""); setRetry((n) => n + 1); }, allCases, visibleCases, submit };
}
