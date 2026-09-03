import { ExternalLink, Paperclip } from "lucide-react";
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
  const empty = props.revision.attachmentIds.length === 0
    && props.linkIds.length === 0
    && (pending?.entries.length ?? 0) === 0;
  return <div className={styles.contextList}>
    {pending?.enabled && <InspectorPendingAttachments locale={props.locale} />}
    {empty
      ? <TabEmpty
          icon={<Paperclip size={22} />}
          text={ru ? "Нет файлов и ссылок" : "No files or links"}
        />
      : <>
          {props.revision.attachmentIds.length > 0 && <div className={styles.attachmentGallery}>
            {props.revision.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id}
              presentation="media" variant="gallery" />)}
          </div>}
          {props.linkIds.length > 0 && <div className={styles.attachmentLinks}>
            {props.linkIds.map((id) => <span className={styles.fileRecord} key={id}>
              <ExternalLink size={15} /><span>{id}</span>
            </span>)}
          </div>}
        </>}
  </div>;
}

function TabEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className={styles.tabEmpty}>{icon}<span>{text}</span></div>;
}
