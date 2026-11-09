import { Button, Link, Spinner } from "@heroui/react";
import { ExternalLink } from "lucide-react";
import type {
  Activity,
  TestCaseRevision,
  TestCaseSummary,
} from "../../../../../../core/tms/contracts/legacy-contract";
import { AttachmentLink } from "../../../../attachments/presentation/link/AttachmentLink";
import type { TmsLocale } from "../../../../localization/model/locale";
import { CaseActivityTab } from "../../collaboration/defects/CaseActivityTab";
import type { CaseCollaborationViewModel } from "../../collaboration/model";
import { InspectorPendingAttachments } from "../../inspector/attachments/InspectorPendingAttachments";
import { useCaseAttachmentDraft } from "../../inspector/attachments/CaseAttachmentDraftContext";
import { MarkdownAttachmentButton } from "../../inspector/markdown/attachments/MarkdownAttachmentUi";
import type { InspectorTabId } from "../../inspector/model";
import styles from "./attachments/case-attachments.module.css";
import { CaseTabEmpty } from "./empty/CaseTabEmpty";
import emptyStyles from "./empty/case-tab-empty.module.css";

export type DetailTab = InspectorTabId;
type Props = {
  tab: Exclude<DetailTab, "overview">;
  locale: TmsLocale;
  languageTag: string;
  testCase?: TestCaseSummary;
  revision: TestCaseRevision;
  attachmentIds: string[];
  removableAttachmentIds?: ReadonlySet<string>;
  linkIds: string[];
  externalImages?: readonly { url: string; label: string }[];
  activity: Activity[];
  collaboration: CaseCollaborationViewModel;
  requestAttachmentEdit?: () => void;
  onOpenDefect: (defectId: string) => void;
  onRunCase: () => void;
};

export function CaseContextTab(props: Props) {
  const ru = props.locale === "ru";
  const pending = useCaseAttachmentDraft();
  if (props.tab === "activity") {
    return <CaseActivityTab
      locale={props.locale}
      languageTag={props.languageTag}
      testCase={props.testCase}
      activity={props.activity}
      model={props.collaboration}
      onOpenDefect={props.onOpenDefect}
      onRunCase={props.onRunCase}
    />;
  }
  const { comments, retryComments, refreshComments, loadMoreComments } = props.collaboration;
  const requestEdit = pending && !pending.locked ? props.requestAttachmentEdit : undefined;
  const commentsSettled = (comments.status === "ready" || comments.status === "unavailable")
    && !comments.hasMore && !comments.loadingMore && !comments.loadMoreFailed
    && !comments.refreshing && !comments.refreshFailed;
  const empty = props.attachmentIds.length === 0 && props.linkIds.length === 0
    && !props.externalImages?.length && !pending?.entries.length && commentsSettled;
  if (empty) return <CaseTabEmpty kind="attachments" locale={props.locale}>
    {pending && requestEdit && <MarkdownAttachmentButton locale={props.locale} className={emptyStyles.attachmentAction}
      text={ru ? "Добавить вложение" : "Add attachment"}
      onFiles={(files) => {
        if (files.length === 0) return;
        if (!pending.enabled) requestEdit();
        pending.add("case-files", files);
      }} />}
    {pending?.problem?.fieldKey === "case-files" && <p className={emptyStyles.attachmentError} role="alert">
      {pending.problem.message}
    </p>}
  </CaseTabEmpty>;

  return <div className={styles.content}>
    {pending?.enabled && <InspectorPendingAttachments locale={props.locale} includeStepFiles showPicker={false} />}
    {props.attachmentIds.length > 0 && <div className={styles.list}>
      {props.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id}
        presentation="media" variant="gallery" canRemove={Boolean(props.removableAttachmentIds?.has(id))} />)}
    </div>}
    {(props.linkIds.length > 0 || Boolean(props.externalImages?.length)) && <div className={styles.list}>
      {props.linkIds.map((id) => <span className={styles.fileRecord} key={id}>
        <ExternalLink size={15} aria-hidden="true" /><span>{id}</span>
      </span>)}
      {props.externalImages?.map(({ url, label }) => <Link className={styles.fileRecord} key={url}
        href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={15} aria-hidden="true" /><span>{label}</span>
      </Link>)}
    </div>}
    {(comments.status === "loading" || comments.refreshing) && <p role="status" className={styles.status}>
      <Spinner size="sm" className={styles.spinner} aria-hidden="true" />
      {ru ? "Загружаем вложения из комментариев…" : "Loading attachments from comments…"}
    </p>}
    {(comments.status === "error" || comments.refreshFailed) && <div className={styles.status}>
      <span role="alert">{ru ? "Не удалось загрузить вложения из комментариев." : "Could not load attachments from comments."}</span>
      <Button size="sm" variant="light" disableRipple onPress={comments.status === "error" ? retryComments : refreshComments}>
        {ru ? "Повторить" : "Retry"}
      </Button>
    </div>}
    {comments.status === "ready" && (comments.hasMore || comments.loadMoreFailed) && <div className={styles.status}>
      {comments.loadMoreFailed && <span role="alert">{ru ? "Не удалось загрузить более ранние вложения." : "Could not load earlier attachments."}</span>}
      <Button size="sm" variant="light" disableRipple isDisabled={comments.loadingMore || comments.refreshing}
        aria-busy={comments.loadingMore || undefined} onPress={comments.hasMore ? loadMoreComments : refreshComments}>
        {comments.loadingMore ? (ru ? "Загрузка…" : "Loading…")
          : comments.loadMoreFailed ? (ru ? "Повторить" : "Retry")
          : (ru ? "Загрузить вложения из ранних комментариев" : "Load attachments from earlier comments")}
      </Button>
    </div>}
  </div>;
}
