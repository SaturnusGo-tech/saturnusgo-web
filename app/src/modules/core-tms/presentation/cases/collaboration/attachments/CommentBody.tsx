import { MarkdownField } from "../../inspector/markdown/MarkdownField";
import { AttachmentLink } from "../../../../attachments/presentation/link/AttachmentLink";
import { readCommentAttachments } from "../../../../test-cases/collaboration/model/attachments/comment-attachments";

export function CommentBody({ body, ru }: { body: string; ru: boolean }) {
  const { text, attachments } = readCommentAttachments(body);
  return <>
    {text && <MarkdownField value={text} label={ru ? "Комментарий" : "Comment"} />}
    {attachments.length > 0 && <div aria-label={ru ? "Вложения комментария" : "Comment attachments"}>
      {attachments.map(item => <AttachmentLink key={item.id} attachmentId={item.id} presentation="media" canRemove={false} />)}
    </div>}
  </>;
}
