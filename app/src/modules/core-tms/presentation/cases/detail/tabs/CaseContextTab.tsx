import { ExternalLink, FileClock, Paperclip } from "lucide-react";
import type { Activity, TestCaseRevision, TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { AttachmentLink } from "../../../../attachments/presentation/link/AttachmentLink";
import { activityLabel } from "../../../../localization/activity/label";
import type { TmsLocale } from "../../../../localization/model/locale";
import styles from "../../cases.module.css";

export type DetailTab = "overview" | "activity" | "files";

type Props = {
  tab: Exclude<DetailTab, "overview">;
  locale: TmsLocale;
  languageTag: string;
  testCase: TestCaseSummary;
  revision: TestCaseRevision;
  linkIds: string[];
  activity: Activity[];
};

export function CaseContextTab(props: Props) {
  const ru = props.locale === "ru";
  if (props.tab === "activity") {
    const caseActivity = props.activity
      .filter((entry) => entry.entityKey === props.testCase.key)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    return <div className={styles.contextList}>
      {caseActivity.length === 0 ? <TabEmpty icon={<FileClock size={22} />} text={ru ? "История пока пуста" : "No activity yet"} /> : caseActivity.slice(0, 20).map((entry) => <div className={styles.activityRecord} key={entry.id}>
        <span>{entry.actor.slice(0, 1).toUpperCase()}</span>
        <div><strong>{activityLabel(props.locale, entry.action)}</strong><small>{entry.actor} · {new Date(entry.createdAt).toLocaleString(props.languageTag, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>
      </div>)}
    </div>;
  }
  const empty = props.revision.attachmentIds.length === 0 && props.linkIds.length === 0;
  return <div className={styles.contextList}>
    {empty ? <TabEmpty icon={<Paperclip size={22} />} text={ru ? "Нет файлов и ссылок" : "No files or links"} /> : <>
      {props.revision.attachmentIds.map((id) => <span className={styles.fileRecord} key={id}><Paperclip size={15} /><AttachmentLink attachmentId={id} /></span>)}
      {props.linkIds.map((id) => <span className={styles.fileRecord} key={id}><ExternalLink size={15} /><span>{id}</span></span>)}
    </>}
  </div>;
}

function TabEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className={styles.tabEmpty}>{icon}<span>{text}</span></div>;
}
