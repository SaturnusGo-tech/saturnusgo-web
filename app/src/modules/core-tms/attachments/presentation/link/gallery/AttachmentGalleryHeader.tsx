import { Button } from "@heroui/react";
import { ChevronDown, Download, ExternalLink, FileText, Image, Paperclip, Trash2, Video } from "lucide-react";
import type { ReactNode } from "react";
import { FalconTooltip } from "../../../../presentation/common/tooltip/FalconTooltip";
import styles from "./attachment-gallery-header.module.css";

type Props = {
  name: string;
  detail?: string;
  mediaType: "image" | "video" | "pdf" | "file";
  locale: "en" | "ru";
  expanded: boolean;
  loading: boolean;
  removing: boolean;
  togglePreview: () => void;
  onOpen?: () => void;
  onDownload?: () => void;
  onRemove?: () => void;
};

const mediaIcons = { image: Image, video: Video, pdf: FileText, file: Paperclip };

export function AttachmentGalleryHeader({
  name, detail, mediaType, locale, expanded, loading, removing,
  togglePreview, onOpen, onDownload, onRemove,
}: Props) {
  const ru = locale === "ru";
  const KindIcon = mediaIcons[mediaType];
  const canPreview = mediaType !== "file";
  const openLabel = ru ? "Открыть файл" : "Open file";
  const downloadLabel = ru ? "Скачать файл" : "Download file";
  const removeLabel = ru ? "Удалить" : "Remove";

  return <figcaption className={styles.header}>
    <Button variant="light" disableRipple className={styles.file}
      title={name} aria-expanded={canPreview ? expanded : undefined}
      onPress={canPreview ? togglePreview : onOpen} isDisabled={!canPreview && (!onOpen || loading)}>
      <KindIcon size={16} aria-hidden="true" />
      <span className={styles.name}>{name}</span>
      {detail && <span className={styles.size}>{detail}</span>}
      {canPreview && <ChevronDown size={13} aria-hidden="true" className={styles.chevron} />}
    </Button>
    <div className={styles.actions}>
      {canPreview && onOpen && <GalleryAction label={openLabel} name={name} disabled={loading} onPress={onOpen}>
        <ExternalLink size={15} aria-hidden="true" />
      </GalleryAction>}
      {onDownload && <GalleryAction label={downloadLabel} name={name} disabled={loading} onPress={onDownload}>
        <Download size={15} aria-hidden="true" />
      </GalleryAction>}
      {onRemove && <GalleryAction label={removeLabel} name={name} disabled={removing} onPress={onRemove} danger>
        <Trash2 size={15} aria-hidden="true" />
      </GalleryAction>}
    </div>
  </figcaption>;
}

function GalleryAction({ label, name, children, disabled, onPress, danger }: {
  label: string; name: string; children: ReactNode; disabled: boolean; onPress: () => void; danger?: boolean;
}) {
  return <FalconTooltip label={label} isDisabled={disabled}>
    <Button size="sm" variant="light" isIconOnly disableRipple className={styles.action}
      data-danger={danger || undefined} aria-label={`${label}: ${name}`} isDisabled={disabled} onPress={onPress}>
      {children}
    </Button>
  </FalconTooltip>;
}
