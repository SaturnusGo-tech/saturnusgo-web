import { ExternalLink, Paperclip } from "lucide-react";
import type {
  Activity,
  TestCaseRevision,
  TestCaseSummary,
} from "../../../../../../core/tms/contracts/legacy-contract";
import { AttachmentLink } from "../../../../attachments/presentation/link/AttachmentLink";
import type { TmsLocale } from "../../../../localization/model/locale";
import { CaseActivityTab } from "../../collaboration/defects/CaseActivityTab";
import { CaseCommentsTab } from "../../collaboration/comments/CaseCommentsTab";
import type { CaseCollaborationViewModel } from "../../collaboration/model";
import { InspectorPendingAttachments } from "../../inspector/attachments/InspectorPendingAttachments";
import type { InspectorTabId } from "../../inspector/model";
import styles from "../../cases.module.css";

export type DetailTab = InspectorTabId;
type Props = {
  tab: Exclude<DetailTab, "overview">;
  locale: TmsLocale;
  languageTag: string;
  testCase?: TestCaseSummary;
  revision: TestCaseRevision;
  linkIds: string[];
  activity: Activity[];
  collaboration: CaseCollaborationViewModel;
  onOpenDefect: (defectId: string) => void;
  onRunCase: () => void;
  pendingFiles?: File[];
  onPendingFiles?: (files: File[]) => void;
};

export function CaseContextTab(props: Props) {
  const ru = props.locale === "ru";
  if (props.tab === "comments") {
    return <CaseCommentsTab
      caseId={props.testCase?.id ?? ""}
      locale={props.locale}
      languageTag={props.languageTag}
      model={props.collaboration}
    />;
  }
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

function TabEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className={styles.tabEmpty}>{icon}<span>{text}</span></div>;
}
