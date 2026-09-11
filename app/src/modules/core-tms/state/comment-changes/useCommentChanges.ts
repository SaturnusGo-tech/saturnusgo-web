import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { changeComment, getComment } from "../../test-cases/collaboration/data/comment-mutations";
import type { CommentDraft } from "../../test-cases/collaboration/model/drafts/comment-draft";
import { upsertNewestComment, type TestCaseComment, type CaseCollaborationFailure } from "../../test-cases/collaboration/model/test-case-collaboration";
import { classifyCollaborationFailure } from "../case-collaboration/usePagedCaseResource";
export function useCommentChanges(input: { targetKind?: "test_case" | "defect"; projectId: string; caseId: string;
  updateItems: (change: (items: readonly TestCaseComment[]) => TestCaseComment[]) => void; refresh: () => void }) {
  const http = useTmsHttpClient();
  const scope = `${input.targetKind ?? "test_case"}:${input.projectId}:${input.caseId}`;
  const active = useRef({ scope, epoch: 0, busy: false });
  const reads = useRef(new Map<string, Promise<boolean>>());
  if (active.current.scope !== scope) active.current = { scope, epoch: active.current.epoch + 1, busy: false };
  const [state, setState] = useState<{ scope: string; id: string | null; failure: CaseCollaborationFailure | null }>({ scope, id: null, failure: null });
  useEffect(() => () => { active.current = { ...active.current, epoch: active.current.epoch + 1, busy: false }; }, []);
  async function perform(id: string, action: () => Promise<TestCaseComment>) {
    if (active.current.busy) return false;
    const owner = active.current;
    owner.busy = true;
    setState({ scope, id, failure: null });
    try {
      const comment = await action();
      if (active.current !== owner) return false;
      input.updateItems((items) => upsertNewestComment(items, comment));
      return true;
    } catch (error) {
      if (active.current === owner) {
        const failure = classifyCollaborationFailure(error);
        setState({ scope, id: null, failure });
        if (failure === "stale" || failure === "forbidden") input.refresh();
      }
      return false;
    } finally {
      owner.busy = false;
      if (active.current === owner) setState((old) => ({ ...old, id: null }));
    }
  }
  function revealComment(id: string): Promise<boolean> {
    const owner = active.current;
    const key = `${scope}:${owner.epoch}:${id}`;
    const existing = reads.current.get(key);
    if (existing) return existing;
    const request = getComment(http, input.projectId, input.caseId, id, input.targetKind).then(comment => {
      if (active.current !== owner) return false;
      input.updateItems(items => {
        const existing = items.find(item => item.id === comment.id);
        return existing && (existing.version ?? 0) > (comment.version ?? 0)
          ? [...items] : upsertNewestComment(items, comment);
      });
      return true;
    }).catch(() => false).finally(() => { reads.current.delete(key); });
    reads.current.set(key, request);
    return request;
  }
  return {
    changingCommentId: state.scope === scope ? state.id : null,
    changeFailure: state.scope === scope ? state.failure : null,
    changeComment: (comment: TestCaseComment, draft: CommentDraft | null) => perform(comment.id,
      () => changeComment(http, input.projectId, input.caseId, comment, draft, input.targetKind)),
    revealComment,
  };
}
