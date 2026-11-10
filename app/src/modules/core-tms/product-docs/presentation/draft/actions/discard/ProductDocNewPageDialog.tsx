"use client";

import { ErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import { Button } from "@heroui/react";
import type { ProductDocsCopy } from "../../../../localization/copy";
import { ProductDocModal } from "../../../overlay/ProductDocModal";
import overlay from "../../../overlay/product-doc-overlay.module.css";
import chrome from "../../../product-docs.module.css";

export function ProductDocNewPageDialog({ copy, busy, canSave, error, onCancel, onSave }: {
  copy: ProductDocsCopy;
  busy: boolean;
  canSave: boolean;
  error: string;
  onCancel(): void;
  onSave(): Promise<void>;
}) {
  return <ProductDocModal title={copy.saveBeforeCreate} subtitle={copy.saveBeforeCreateDetail}
    closeLabel={copy.cancel} busy={busy} onClose={onCancel}>
    <ErrorToast message={error} />
    <div className={overlay.confirmActions}>
      <Button autoFocus type="button" variant="light" className={chrome.action} isDisabled={busy} onPress={onCancel}>
        {copy.keepEditing}
      </Button>
      <Button type="button" className={chrome.primary} isDisabled={!canSave || busy} onPress={() => void onSave()}>
        {busy ? copy.saving : copy.saveAndCreate}
      </Button>
    </div>
  </ProductDocModal>;
}
