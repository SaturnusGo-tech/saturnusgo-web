import { ExternalLink, FileClock, MessageSquare, Paperclip } from "lucide-react";
import { useState } from "react";
import type {
  Activity,
  TestCaseRevision,
  TestCaseSummary,
} from "../../../../../../core/tms/contracts/legacy-contract";
import { AttachmentLink } from "../../../../attachments/presentation/link/AttachmentLink";
import { activityLabel } from "../../../../localization/activity/label";
import type { TmsLocale } from "../../../../localization/model/locale";
import inspector from "../../inspector/caseInspector.module.css";
import { InspectorPendingAttachments } from "../../inspector/attachments/InspectorPendingAttachments";
import type { InspectorTabId } from "../../inspector/model";
import styles from "../../cases.module.css";

export type DetailTab = InspectorTabId;
export type InspectorComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

type Props = {
  tab: Exclude<DetailTab, "overview">;
  locale: TmsLocale;
  languageTag: string;
  testCase?: TestCaseSummary;
  revision: TestCaseRevision;
  linkIds: string[];
  activity: Activity[];
  comments?: InspectorComment[];
  onAddComment?: (body: string) => void | Promise<void>;
  pendingFiles?: File[];
  onPendingFiles?: (files: File[]) => void;
};

export function CaseContextTab(props: Props) {
  const ru = props.locale === "ru";
  const [comment, setComment] = useState("");
  if (props.tab === "comments") {
    const comments = props.comments ?? [];
    return <div className={styles.contextList}>
      {props.onAddComment && <div className={inspector.commentComposer}>
        <textarea
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={ru ? "Добавить комментарий…" : "Add a comment…"}
        />
        <button
          type="button"
          disabled={!comment.trim()}
          onClick={() => {
            void props.onAddComment?.(comment.trim());
            setComment("");
          }}
        >
          {ru ? "Отправить" : "Post"}
        </button>
      </div>}
      {comments.length === 0
        ? <TabEmpty
            icon={<MessageSquare size={22} />}
            text={ru ? "Комментариев пока нет" : "No comments yet"}
          />
        : comments.map((entry) => <div className={styles.activityRecord} key={entry.id}>
            <span>{entry.author.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{entry.body}</strong>
              <small>{entry.author} · {formatTime(entry.createdAt, props.languageTag)}</small>
            </div>
          </div>)}
    </div>;
  }
  if (props.tab === "activity") {
    const caseActivity = props.activity
      .filter((entry) => entry.entityKey === props.testCase?.key)
      .sort((left, right) => (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ));
    return <div className={styles.contextList}>
      {caseActivity.length === 0
        ? <TabEmpty
            icon={<FileClock size={22} />}
            text={ru ? "История пока пуста" : "No activity yet"}
          />
        : caseActivity.slice(0, 20).map((entry) => (
          <div className={styles.activityRecord} key={entry.id}>
            <span>{entry.actor.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{activityLabel(props.locale, entry.action)}</strong>
              <small>{entry.actor} · {formatTime(entry.createdAt, props.languageTag)}</small>
            </div>
          </div>
        ))}
    </div>;
  }
  const pending = props.pendingFiles ?? [];
  const empty = props.revision.attachmentIds.length === 0
    && props.linkIds.length === 0
    && pending.length === 0;
  return <div className={styles.contextList}>
    {props.onPendingFiles && <InspectorPendingAttachments locale={props.locale} files={pending} onFiles={props.onPendingFiles} />}
    {empty
      ? <TabEmpty
          icon={<Paperclip size={22} />}
          text={ru ? "Нет файлов и ссылок" : "No files or links"}
        />
      : <>
          {props.revision.attachmentIds.map((id) => (
            <span className={styles.fileRecord} key={id}>
              <Paperclip size={15} /><AttachmentLink attachmentId={id} />
            </span>
          ))}
          {props.linkIds.map((id) => <span className={styles.fileRecord} key={id}>
            <ExternalLink size={15} /><span>{id}</span>
          </span>)}
        </>}
  </div>;
}

function formatTime(value: string, languageTag: string) {
  return new Date(value).toLocaleString(languageTag, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TabEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className={styles.tabEmpty}>{icon}<span>{text}</span></div>;
}
