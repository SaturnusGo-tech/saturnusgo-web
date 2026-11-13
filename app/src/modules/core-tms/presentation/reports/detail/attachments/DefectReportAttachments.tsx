import { Link } from "@heroui/react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import type { ExternalLink } from "../../../../../../core/tms/contracts/legacy-contract";
import { AttachmentLink } from "../../../../attachments/presentation/link/AttachmentLink";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import files from "../../../cases/detail/tabs/attachments/case-attachments.module.css";
import empty from "../../../cases/detail/tabs/empty/case-tab-empty.module.css";

export function DefectReportAttachments({ attachmentIds, links }: { attachmentIds: string[]; links: ExternalLink[] }) {
  const { locale, t } = useTmsLocale();
  if (attachmentIds.length === 0 && links.length === 0) return <div className={empty.empty}>
    <div className={empty.content}>
      <img className={empty.illustration} src="/falcon/cases/empty-attachments.webp" width={174} height={116} alt="" />
      <h3>{locale === "ru" ? "Вложений пока нет" : "No attachments yet"}</h3>
      <p>{t("reports.noEvidence")}</p>
    </div>
  </div>;
  return <div className={files.content}>
    {attachmentIds.length > 0 && <div className={files.list}>
      {attachmentIds.map(id => <AttachmentLink key={id} attachmentId={id} presentation="media" variant="gallery" />)}
    </div>}
    {links.length > 0 && <div className={files.list}>
      {links.map(link => <Link key={link.id} className={files.fileRecord} href={link.targetUri} target="_blank" rel="noopener noreferrer">
        <ExternalLinkIcon size={15} aria-hidden="true" /><span>{link.label}</span>
      </Link>)}
    </div>}
  </div>;
}
