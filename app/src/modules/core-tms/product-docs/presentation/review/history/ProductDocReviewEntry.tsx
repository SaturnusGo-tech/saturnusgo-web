import { Button, Textarea } from "@heroui/react";
import { Check, Clock3, MessageSquareText } from "lucide-react";
import { useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import type { ProductDocReview, ProductDocReviewDecision, ProductDocReviewSource } from "../../../domain/review/productDocReview";
import type { ProductDocReviewCopy } from "../../../localization/review/review-copy";
import fields from "../../fields/product-doc-field.module.css";
import { productDocFieldSlots } from "../../fields/productDocFieldSlots";
import styles from "../review.module.css";

const icons = { pending: Clock3, approved: Check, changes_requested: MessageSquareText };

export function ProductDocReviewEntry({ review, source, copy, locale, workspaceId, busy, onDecide }: {
  review: ProductDocReview;
  source: ProductDocReviewSource;
  copy: ProductDocReviewCopy;
  locale: TmsLocale;
  workspaceId: string;
  busy: boolean;
  onDecide(decision: ProductDocReviewDecision, note?: string): Promise<boolean>;
}) {
  const [responding, setResponding] = useState(false);
  const [note, setNote] = useState("");
  const StatusIcon = icons[review.status];
  const section = source.sections.find((item) => item.id === review.sectionId);
  const label = review.sectionId ? section ? (section.title || copy.untitled) : copy.section : copy.article;
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(review.decidedAt ?? review.requestedAt));
  const matchesDraft = source.kind === "draft" && source.draftVersion === review.draftVersion;
  const canRespond = review.canDecide && !review.stale && review.status === "pending";
  const editableDecision = canRespond && matchesDraft && source.kind === "draft" && !source.dirty;

  async function decide(decision: ProductDocReviewDecision) {
    if (await onDecide(decision, note.trim() || undefined)) {
      setResponding(false);
      setNote("");
    }
  }

  return <li className={styles.entry}>
    <div className={styles.entryHeading}>
      <strong>{label}</strong>
      <span className={styles.reviewStatus} data-status={review.status}>
        <StatusIcon size={13} aria-hidden="true" />{copy[review.status]}
      </span>
    </div>
    <div className={styles.entryMeta}>
      <span className={styles.reviewAvatar} aria-hidden="true">
        <MemberAvatar workspaceId={workspaceId} identityId={review.reviewerIdentityId} name={review.reviewerDisplayName} />
      </span>
      <div className={styles.entryReviewer}>
        <span>{review.reviewerDisplayName}</span>
        <small>{review.stale ? copy.earlier : copy.draft} {review.draftVersion}</small>
      </div>
      <time dateTime={review.decidedAt ?? review.requestedAt}>{date}</time>
    </div>
    {review.note && <p className={styles.note}>{review.note}</p>}
    {canRespond && matchesDraft && source.kind === "draft" && source.dirty && <p className={styles.message}>{copy.decisionDirty}</p>}
    {editableDecision && !responding && <Button className={styles.textButton} isDisabled={busy}
      onPress={() => setResponding(true)}>{copy.addDecision}</Button>}
    {editableDecision && responding && <div className={styles.decision}>
      <div className={fields.host} data-input-shell>
        <Textarea label={copy.note} labelPlacement="outside-top" minRows={2} maxRows={6} maxLength={4000}
          classNames={productDocFieldSlots} value={note} onValueChange={setNote} isDisabled={busy} />
      </div>
      <div className={styles.buttons}>
        <Button className={styles.textButton} onPress={() => setResponding(false)} isDisabled={busy}>{copy.cancel}</Button>
        <Button className={styles.secondary} onPress={() => void decide("changes_requested")}
          isDisabled={busy}>{copy.changes}</Button>
        <Button className={styles.primary} onPress={() => void decide("approved")}
          isDisabled={busy}>{copy.approve}</Button>
      </div>
    </div>}
  </li>;
}
