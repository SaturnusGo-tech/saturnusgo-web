import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { changeComment, getComment } from "../../test-cases/collaboration/data/comment-mutations";
import type { CommentDraft } from "../../test-cases/collaboration/model/drafts/comment-draft";
import { upsertNewestComment, type TestCaseComment, type CaseCollaborationFailure } from "../../test-cases/collaboration/model/test-case-collaboration";
import { classifyCollaborationFailure } from "../case-collaboration/usePagedCaseResource";
export function useCommentChanges(input: { projectId: string; caseId: string;
  updateItems: (change: (items: readonly TestCaseComment[]) => TestCaseComment[]) => void; refresh: () => void }) {
  const http = useTmsHttpClient();
  const scope = `${input.projectId}:${input.caseId}`;
  const active = useRef({ scope, epoch: 0, busy: false });
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
  return {
    changingCommentId: state.scope === scope ? state.id : null,
    changeFailure: state.scope === scope ? state.failure : null,
    changeComment: (comment: TestCaseComment, draft: CommentDraft | null) => perform(comment.id,
      () => changeComment(http, input.projectId, input.caseId, comment, draft)),
    revealComment: (id: string) => perform(id, () => getComment(http, input.projectId, input.caseId, id)),
  };
}
