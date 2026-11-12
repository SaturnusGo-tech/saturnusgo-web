import { useEffect, useRef, useState } from "react";
import type { Project } from "../../../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { loadImportContext } from "../../data/context/import-context";

type Context = Awaited<ReturnType<typeof loadImportContext>>;
export function useImportTarget(http: TmsHttpClient, props: { project: Project; workspaceId?: string;
  folders?: readonly RepositoryFolder[]; initialFolderId?: string | null }) {
  const [targetProject, setProject] = useState(props.project);
  const [context, setContext] = useState<Context | null>(null);
  const [destination, setDestination] = useState("/");
  const [loadingTarget, setLoading] = useState(true);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const loading = useRef(true), initial = useRef(true);
  const scope = JSON.stringify([props.workspaceId, props.project.id]);
  const currentScope = useRef({ scope, http }); currentScope.current = { scope, http };
  const loadedScope = useRef(currentScope.current), sequence = useRef(0);
  const renderedSequence = sequence.current;
  async function load(project: Project, useInitial: boolean) {
    controller.current?.abort();
    sequence.current++; loadedScope.current = { scope, http };
    const abort = new AbortController(); controller.current = abort; loading.current = true;
    setProject(project); setContext(null); setDestination("/"); setLoading(true); setError("");
    try {
      const workspaceId = props.workspaceId ?? props.folders?.[0]?.workspaceId;
      const value = await loadImportContext(http, project.id, abort.signal,
        workspaceId ? { workspaceId, folders: useInitial ? props.folders : undefined } : undefined);
      if (abort.signal.aborted || controller.current !== abort) return;
      setContext(value);
      const folder = useInitial ? value.folders.find(item => item.id === props.initialFolderId && !item.archivedAt) : undefined;
      setDestination(folder?.path ?? "/");
    } catch (failure) {
      if (!abort.signal.aborted && controller.current === abort) setError(failure instanceof Error ? failure.message : "Unable to load folders.");
    } finally {
      if (controller.current === abort && !abort.signal.aborted) { loading.current = false; setLoading(false); }
    }
  }
  useEffect(() => {
    initial.current = true; void load(props.project, true);
    return () => { controller.current?.abort(); };
  }, [http, props.project.id, props.workspaceId]);
  return { targetProject, context, setContext, destination, loadingTarget, error,
    isScopeCurrent: () => currentScope.current.scope === scope && currentScope.current.http === http,
    isCurrent: () => !loading.current && sequence.current === renderedSequence
      && loadedScope.current.scope === currentScope.current.scope && loadedScope.current.http === currentScope.current.http,
    setDestination: (path: string) => { if (!loading.current) setDestination(path); },
    selectProject: (project: Project) => { initial.current = false; return load(project, false); },
    retryContext: () => load(targetProject, initial.current) };
}
