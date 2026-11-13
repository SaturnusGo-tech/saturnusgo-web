import { ProductDocTooltip } from "../../overlay/ProductDocTooltip";

import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { Check, X } from "lucide-react";
import type { ProductDocScope } from "../../../domain/product-docs";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocsCopy } from "../../../localization/copy";
import chrome from "../../product-docs.module.css";
import styles from "../editor.module.css";
import { ProductDocCodexAction } from "./codex/ProductDocCodexAction";

export function DraftActions({ copy, locale, scope, folder, canPublish, publishLabel, canSave, canSubmit, busy, mediaBusy, saved, review, lifecycle, onSave, onClose }: {
  copy: ProductDocsCopy;
  locale: TmsLocale;
  scope: ProductDocScope;
  folder: boolean;
  canPublish: boolean;
  publishLabel: string;
  canSave: boolean;
  canSubmit: boolean;
  busy: boolean;
  mediaBusy: boolean;
  saved: boolean;
  review?: ReactNode;
  lifecycle?: ReactNode;
  onSave(publish: boolean): void;
  onClose(): void;
}) {
  const ru = locale === "ru";
  const closeLabel = ru ? "Закрыть редактор" : "Close editor";

  return <div className={styles.actions}>
    {review}
    {!folder && <ProductDocCodexAction scope={scope} locale={locale} disabled={busy || mediaBusy} />}
    {!folder && <span className={styles.saveStatus} role="status">
      {busy ? copy.saving : saved && <><Check size={13} aria-hidden="true" />{ru ? "Сохранено" : "Saved"}</>}
    </span>}
    <Button className={canPublish ? styles.saveDraft : `${chrome.primary} ${styles.publish}`}
      isDisabled={!canSave} onPress={() => onSave(false)}>
      {folder ? copy.saveName : copy.save}
    </Button>
    {canPublish && <Button className={`${chrome.primary} ${styles.publish}`}
      isDisabled={!canSubmit} onPress={() => onSave(true)}>{publishLabel}</Button>}
    {lifecycle}
    {folder ? <Button className={styles.saveDraft} isDisabled={busy} onPress={onClose}>{copy.cancel}</Button>
      : <ProductDocTooltip label={closeLabel}><Button isIconOnly className={styles.closeEditor} aria-label={closeLabel}
        isDisabled={busy} onPress={onClose}><X size={17} aria-hidden="true" /></Button></ProductDocTooltip>}
  </div>;
}
