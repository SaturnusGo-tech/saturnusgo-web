import { addToast, Alert, Button, Spinner } from "@heroui/react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { TmsLocale } from "../../../localization/model/locale";
import type { ProductDocReviewRequest, ProductDocReviewSource, ProductDocReviewTarget } from "../../domain/review/productDocReview";
import { productDocReviewError, type ProductDocReviewCopy } from "../../localization/review/review-copy";
import type { useProductDocReviews } from "../../state/review/useProductDocReviews";
import { ProductDocReviewEntry } from "./history/ProductDocReviewEntry";
import { ProductDocReviewRequestForm } from "./request/ProductDocReviewRequestForm";
import styles from "./review.module.css";

export function ProductDocReviewPanel({ reviews, target, source, copy, locale, popoverContainer, onClose }: {
  reviews: ReturnType<typeof useProductDocReviews>;
  target: ProductDocReviewTarget;
  source: ProductDocReviewSource;
  copy: ProductDocReviewCopy;
  locale: TmsLocale;
  popoverContainer: RefObject<HTMLDivElement | null>;
  onClose(): void;
}) {
  const draft = source.kind === "draft" ? source : undefined;
  const [requesting, setRequesting] = useState(false);
  const [height, setHeight] = useState<number>();
  const heading = useRef<HTMLHeadingElement>(null);
  const measured = useRef<HTMLDivElement>(null);
  const previousForm = useRef(false);
  const reducedMotion = useReducedMotion();
  const canRequest = Boolean(reviews.data?.canRequest);
  const outdated = draft && reviews.data && draft.draftVersion !== reviews.data.currentDraftVersion;
  const allowRequest = canRequest && draft && !draft.dirty && !outdated;
  const showForm = Boolean(requesting && allowRequest);
  const canOpenDraft = canRequest || reviews.reviews.some((review) => review.canDecide);
  const loading = reviews.resource.status === "loading";
  const approvalSaved = draft && !draft.canPublish && !draft.dirty && !outdated
    && reviews.reviews.some((review) => review.status === "approved" && !review.stale);

  useLayoutEffect(() => {
    const element = measured.current;
    if (!element) return;
    const measure = () => setHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (previousForm.current === showForm) return;
    previousForm.current = showForm;
    heading.current?.focus({ preventScroll: true });
  }, [showForm]);

  async function send(selection: Pick<ProductDocReviewRequest, "reviewerIdentityId" | "sectionId">) {
    if (draft && allowRequest && await reviews.request({ ...selection, expectedDraftVersion: draft.draftVersion })) {
      onClose();
      addToast({ title: copy.sent, severity: "success", timeout: 2500 });
    }
  }

  return <div className={styles.content} style={height === undefined ? undefined : { gridTemplateRows: `${height}px` }}>
    <div ref={measured} className={styles.layout}>
      <header className={styles.heading}>
        <div className={styles.headingTitle}>
          {showForm && <Button isIconOnly className={styles.panelIcon} aria-label={copy.back} isDisabled={reviews.busy}
            onPress={() => { reviews.clearError(); setRequesting(false); }}>
            <ArrowLeft size={15} aria-hidden="true" />
          </Button>}
          <h2 ref={heading} tabIndex={-1}>{showForm ? copy.request : copy.title}</h2>
        </div>
        <Button isIconOnly className={styles.panelIcon} aria-label={copy.close} title={copy.close} onPress={onClose}>
          <X size={16} aria-hidden="true" />
        </Button>
      </header>
      {reviews.error && <Alert color="danger" isVisible description={productDocReviewError(copy, reviews.error)}
        classNames={{ base: styles.error, iconWrapper: styles.alertIcon }} />}
      {loading && <Spinner role="status" variant="simple" label={copy.loading}
        classNames={{ base: styles.loading, wrapper: styles.spinner, circle1: styles.spinnerTrack }} />}
      {reviews.resource.status === "error" && <Alert color="danger" isVisible description={copy.loadError}
        classNames={{ base: styles.error, iconWrapper: styles.alertIcon }}
        endContent={<Button className={styles.textButton} onPress={reviews.resource.retry}>{copy.retry}</Button>} />}
      <motion.div key={showForm ? "request" : "history"} className={styles.body}
        initial={reducedMotion ? false : { opacity: 0, x: showForm ? 6 : -5 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reducedMotion ? 0 : .19, ease: [.22, .7, .2, 1] }}>
        {showForm && draft && <ProductDocReviewRequestForm workspaceId={target.workspaceId} sections={draft.sections}
          popoverContainer={popoverContainer.current ?? undefined}
          copy={copy} busy={reviews.busy} onSubmit={(selection) => void send(selection)} />}
        {!showForm && reviews.data && <>
          {reviews.reviews.length === 0 && <p className={styles.message}>{copy.empty}</p>}
          {reviews.reviews.length > 0 && <ol className={styles.feed}>
            {reviews.reviews.map((review) => <ProductDocReviewEntry key={review.id} review={review} source={source}
              copy={copy} locale={locale} workspaceId={target.workspaceId} busy={reviews.busy}
              onDecide={(decision, note) => reviews.decide(review.id, { decision, note })} />)}
          </ol>}
          {approvalSaved && <p className={styles.message} role="status">{copy.approvalSaved}</p>}
          {reviews.cursor && <Button className={styles.textButton}
            isDisabled={reviews.moreState === "loading"} onPress={() => void reviews.loadMore()}>
            {reviews.moreState === "loading" ? copy.loading : reviews.moreState === "error" ? copy.retry : copy.more}
          </Button>}
          {(source.kind === "article" ? canOpenDraft : canRequest) && <footer className={styles.footer}>
            {source.kind === "article"
              ? <Button className={styles.secondary} onPress={source.onOpenDraft}>{copy.openDraft}</Button>
              : allowRequest
                ? <Button className={styles.primary} isDisabled={reviews.busy}
                    onPress={() => { reviews.clearError(); setRequesting(true); }}>{copy.request}</Button>
                : <p className={styles.message}>{outdated ? copy.outdated : copy.saveFirst}</p>}
          </footer>}
        </>}
      </motion.div>
    </div>
  </div>;
}
