import { useEffect, useRef, useState } from "react";
import type { CaseCollaborationViewModel } from "../model";
/** Resolve parents outside the current page through the same scoped, authenticated API. */
export function useCommentAncestors(caseId: string, model: CaseCollaborationViewModel) {
  const latest = useRef(model); latest.current = model;
  const attempts = useRef({ caseId, ids: new Set<string>() });
  if (attempts.current.caseId !== caseId) attempts.current = { caseId, ids: new Set<string>() };
  useEffect(() => () => { attempts.current = { caseId: "", ids: new Set() }; }, []);
  useEffect(() => { if (model.comments.refreshing) attempts.current.ids.clear(); }, [model.comments.refreshing]);
  const [iteration, next] = useState(0);
  const ids = new Set(model.comments.items.map(item => item.id));
  const missing = model.comments.items.map(item => item.parentId).filter((id): id is string => Boolean(id && !ids.has(id)));
  const signature = missing.join(":");
  useEffect(() => {
    if (model.comments.status !== "ready" || model.changingCommentId || model.commentSubmitting) return;
    const id = missing.find(id => !attempts.current.ids.has(id));
    if (!id || !latest.current.revealComment) return;
    const owner = attempts.current; owner.ids.add(id);
    void latest.current.revealComment(id).finally(() => { if (attempts.current === owner) next(value => value + 1); });
  }, [caseId, signature, iteration, model.comments.status, model.changingCommentId, model.commentSubmitting]);
}
