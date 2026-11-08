import { Check, X } from "lucide-react";
import type { ProductDocScope } from "../../../domain/product-docs";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { ProductDocsCopy } from "../../../localization/copy";
import chrome from "../../product-docs.module.css";
import styles from "../editor.module.css";
import { ProductDocCodexAction } from "./codex/ProductDocCodexAction";

export function DraftActions({ copy, locale, scope, folder, canPublish, publishLabel, canSave, canSubmit, busy, mediaBusy, saved, onSave, onClose }: {
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
  onSave(publish: boolean): void;
  onClose(): void;
}) {
  const ru = locale === "ru";
  const closeLabel = ru ? "Закрыть редактор" : "Close editor";

  return <div className={styles.actions}>
    {!folder && <ProductDocCodexAction scope={scope} locale={locale} disabled={busy || mediaBusy} />}
    {!folder && <span className={styles.saveStatus} role="status">
      {busy ? copy.saving : saved && <><Check size={13} aria-hidden="true" />{ru ? "Сохранено" : "Saved"}</>}
    </span>}
    <button type="button" className={canPublish ? styles.saveDraft : `${chrome.primary} ${styles.publish}`}
      disabled={!canSave} onClick={() => onSave(false)}>
      {folder ? copy.saveName : copy.save}
    </button>
    {canPublish && <button type="button" className={`${chrome.primary} ${styles.publish}`}
      disabled={!canSubmit} onClick={() => onSave(true)}>{publishLabel}</button>}
    {folder ? <button type="button" className={styles.saveDraft} disabled={busy} onClick={onClose}>{copy.cancel}</button>
      : <button type="button" className={styles.closeEditor} aria-label={closeLabel} title={closeLabel}
        disabled={busy} onClick={onClose}><X size={17} aria-hidden="true" /></button>}
  </div>;
}
