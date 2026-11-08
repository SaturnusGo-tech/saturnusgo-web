"use client";

import { Button } from "@heroui/react";
import type { ProductDocsCopy } from "../../../../localization/copy";
import { ProductDocModal } from "../../../overlay/ProductDocModal";
import overlay from "../../../overlay/product-doc-overlay.module.css";
import chrome from "../../../product-docs.module.css";

export function ProductDocDiscardDialog({ copy, ru, onCancel, onDiscard }: {
  copy: ProductDocsCopy;
  ru: boolean;
  onCancel(): void;
  onDiscard(): void;
}) {
  return <ProductDocModal title={copy.unsaved} closeLabel={copy.close} onClose={onCancel}>
    <div className={overlay.confirmActions}>
      <Button autoFocus type="button" variant="light" className={chrome.action} onPress={onCancel}>{copy.cancel}</Button>
      <Button type="button" className={chrome.primary} onPress={onDiscard}>{ru ? "Отбросить изменения" : "Discard changes"}</Button>
    </div>
  </ProductDocModal>;
}
