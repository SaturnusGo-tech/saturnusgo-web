"use client";

import type { ProductDocsCopy } from "../../../../localization/copy";
import { ProductDocDiscardDialog } from "../discard/ProductDocDiscardDialog";
import { ProductDocNewPageDialog } from "../discard/ProductDocNewPageDialog";

export function ProductDocDraftNavigation({ copy, ru, busy, error, discardOpen, createPending,
  canSave, validationError, onKeep, onDiscard, onCancel, onSave }: {
  copy: ProductDocsCopy;
  ru: boolean;
  busy: boolean;
  error: string;
  discardOpen: boolean;
  createPending: boolean;
  canSave: boolean;
  validationError: string;
  onKeep(): void;
  onDiscard(): void;
  onCancel(): void;
  onSave(): Promise<void>;
}) {
  if (discardOpen) return <ProductDocDiscardDialog copy={copy} ru={ru} onCancel={onKeep} onDiscard={onDiscard} />;
  if (createPending) return <ProductDocNewPageDialog copy={copy} busy={busy} canSave={canSave} error={error || validationError}
    onCancel={onCancel} onSave={onSave} />;
  return null;
}
