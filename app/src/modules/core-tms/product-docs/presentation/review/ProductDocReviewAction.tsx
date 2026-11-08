"use client";

import { Button, Popover, PopoverContent } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { ClipboardCheck } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocReviewsApi, ProductDocReviewSource, ProductDocReviewTarget } from "../../domain/review/productDocReview";
import { productDocReviewCopy } from "../../localization/review/review-copy";
import { useProductDocReviews } from "../../state/review/useProductDocReviews";
import { useProductDocReviewsApi } from "../../state/review/useProductDocReviewsApi";
import { ProductDocTooltip } from "../overlay/ProductDocTooltip";
import { ProductDocReviewPanel } from "./ProductDocReviewPanel";
import styles from "./review.module.css";

type Props = {
  target: ProductDocReviewTarget;
  source: ProductDocReviewSource;
  locale: TmsLocale;
  disabled?: boolean;
};

export function ProductDocReviewAction(props: Props) {
  const api = useProductDocReviewsApi();
  return api ? <ProductDocReviewPopover key={props.target.docId} {...props} api={api} /> : null;
}

function ProductDocReviewPopover({ target, source, locale, disabled, api }: Props & { api: ProductDocReviewsApi }) {
  const copy = productDocReviewCopy(locale);
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const trigger = useRef<HTMLButtonElement>(null!);
  const container = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const draft = source.kind === "draft" ? source : undefined;
  const reviews = useProductDocReviews(api, target, draft?.draftVersion);
  const canRequest = Boolean(reviews.data?.canRequest && (!draft
    || (!draft.dirty && draft.draftVersion === reviews.data.currentDraftVersion)));
  const available = open || reviews.reviews.length > 0 || canRequest || reviews.resource.status === "error";

  if (!available) return null;
  return <Popover ref={container} triggerRef={trigger} isOpen={open} onOpenChange={setOpen} placement="bottom-end" offset={6}
    containerPadding={12} shouldBlockScroll={false} shouldCloseOnScroll={false} disableAnimation={Boolean(reducedMotion)}
    classNames={{ content: styles.panel }} style={{ zIndex: 160 }}>
    <ProductDocTooltip label={copy.title}>
      <Button ref={trigger} isIconOnly className={styles.icon} aria-label={copy.title} isDisabled={disabled}
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined} onPress={() => setOpen(!open)}>
        <ClipboardCheck size={16} aria-hidden="true" />
      </Button>
    </ProductDocTooltip>
    <PopoverContent id={panelId} aria-label={copy.title}>
      <ProductDocReviewPanel reviews={reviews} target={target} source={source} copy={copy} locale={locale}
        popoverContainer={container} onClose={() => setOpen(false)} />
    </PopoverContent>
  </Popover>;
}
