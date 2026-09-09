import { useEffect, useRef, useState } from "react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import { createProject, updateProject } from "../../../application/projects/createProject";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";

export function useProjectForm(input: { workspaceId: string; project?: Project; projectEtag?: string | null; offline: boolean; portfolioId?: string | null; errorText: string }) {
  const http = useTmsHttpClient();
  const [name, setName] = useState(input.project?.name ?? "");
  const [key, setKey] = useState(input.project?.key ?? "");
  const [description, setDescription] = useState(input.project?.description ?? "");
  const [portfolioId, setPortfolioId] = useState(input.project?.portfolioId ?? input.portfolioId ?? null);
  const [responsibleIdentityId, setResponsibleIdentityId] = useState(input.project?.responsibleIdentityId ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  const operation = useRef<PendingOperation | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const fields = { name, key, description, portfolioId, responsibleIdentityId };
  function updateName(next: string) {
    setName(next);
    if (!input.project && (!key || key === name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase())) {
      setKey(next.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase());
    }
  }
  async function save() {
    if (input.offline || (active.current && !active.current.signal.aborted)) return null;
    const controller = new AbortController(); active.current = controller;
    setPending(true); setError("");
    operation.current = resolvePendingOperation(operation.current, JSON.stringify({ workspaceId: input.workspaceId,
      id: input.project?.id, etag: input.projectEtag, ...fields }));
    try {
      const options = { ...input, ...fields, http, signal: controller.signal, operationKey: operation.current.key };
      const result = input.project
        ? await updateProject({ ...options, project: input.project, etag: input.projectEtag ?? null })
        : await createProject(options);
      if (controller.signal.aborted) return null;
      if ("ok" in result && !result.ok) { setError(formatTmsMutationFailure(result.failure, input.errorText)); return null; }
      return "ok" in result ? { data: result.project, etag: result.etag } : result;
    } catch (caught) {
      if (!controller.signal.aborted) setError(formatTmsMutationFailure(toTmsMutationFailure(caught), input.errorText));
      return null;
    } finally {
      const aborted = controller.signal.aborted;
      controller.abort();
      if (!aborted) setPending(false);
    }
  }
  const modified = !input.project || name.trim() !== input.project.name || description.trim() !== (input.project.description ?? "")
    || portfolioId !== (input.project.portfolioId ?? null) || responsibleIdentityId !== (input.project.responsibleIdentityId ?? null);
  return { ...fields, updateName, setKey, setDescription, setPortfolioId, setResponsibleIdentityId, pending, error, modified, save };
}
