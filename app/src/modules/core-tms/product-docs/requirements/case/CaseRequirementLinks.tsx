import { ChevronRight, X } from "lucide-react";
import { OverflowMarquee } from "../../../presentation/common/marquee/OverflowMarquee";
import type { DraftProductDocRequirement } from "../../domain/product-docs";
import styles from "../requirements.module.css";

export function CaseRequirementLinks({ requirements, ru, onOpen, onRemove, disabled }: {
  requirements: readonly DraftProductDocRequirement[];
  ru: boolean;
  onOpen(requirement: DraftProductDocRequirement, source: HTMLButtonElement): void;
  onRemove?(docId: string): void;
  disabled?: boolean;
}) {
  return <ul className={styles.caseLinks}>
    {requirements.map(requirement => {
      const label = [requirement.title, requirement.sectionTitle].filter(Boolean).join(" · ");
      return <li key={requirement.docId} data-removable={Boolean(onRemove) || undefined}>
        <button type="button" className={styles.caseArticle} aria-label={label} title={label}
          onClick={event => onOpen(requirement, event.currentTarget)}>
          <OverflowMarquee text={requirement.title} className={styles.caseArticleTitle} />
          <ChevronRight size={14} aria-hidden="true" />
        </button>
        {onRemove && <button type="button" className={styles.caseRemove} disabled={disabled}
          aria-label={ru ? `Убрать связь с «${requirement.title}»` : `Unlink ${requirement.title}`}
          title={ru ? "Убрать связь" : "Unlink page"}
          onClick={() => onRemove(requirement.docId)}><X size={14} aria-hidden="true" /></button>}
      </li>;
    })}
  </ul>;
}
