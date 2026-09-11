import { ChevronDown, ChevronRight } from "lucide-react";
import { CaseCommentRecord } from "../records/CaseCommentRecord";
import type { CaseCollaborationViewModel } from "../model";
import type { TestCaseComment } from "../../../../test-cases/collaboration/model/test-case-collaboration";
import type { CommentBranch } from "./comment-tree";
import css from "../ancestry/thread.module.css";
type Props = { node: CommentBranch; depth?: number; ru: boolean; languageTag: string; model: CaseCollaborationViewModel;
  collapsed: ReadonlySet<string>; toggle: (id: string) => void; onReply: (comment: TestCaseComment) => void;
  onParent: (id: string) => void };
export function CommentThread(props: Props) {
  const { node, ru, collapsed, toggle, onReply, depth = 0 } = props;
  const hidden = collapsed.has(node.comment.id);
  const hasReplies = node.children.length > 0;
  return <div className={css.thread} data-nested={depth > 0}>
    {hasReplies && !hidden && <button type="button" className={css.rail} onClick={() => toggle(node.comment.id)} aria-label={ru ? "Свернуть ветку" : "Collapse thread"} />}
    <CaseCommentRecord comment={node.comment} ru={ru} languageTag={props.languageTag} model={props.model}
      nested={depth > 0 && depth < 4} onReply={onReply} onParent={props.onParent} />
    {hasReplies && <div className={css.actions}>
      {hasReplies && <button type="button" aria-expanded={!hidden} onClick={() => toggle(node.comment.id)}>
        {hidden ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        {hidden ? (ru ? "Показать ответы" : "Show replies") : (ru ? "Свернуть ветку" : "Collapse thread")}
      </button>}
    </div>}
    {hasReplies && <div hidden={hidden} className={css.replies} data-deep={depth >= 3}>
      {node.children.map(child => <CommentThread key={child.comment.id} {...props} node={child} depth={depth + 1} />)}
    </div>}
  </div>;
}
