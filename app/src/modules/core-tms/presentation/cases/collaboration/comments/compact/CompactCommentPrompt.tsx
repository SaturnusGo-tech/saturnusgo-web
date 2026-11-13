import { Button } from "@heroui/react";
import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import styles from "./compact-comment-prompt.module.css";

export function CompactCommentPrompt({ ru, disabled, onOpen }: { ru: boolean; disabled: boolean; onOpen: () => void }) {
  const label = ru ? "Написать комментарий…" : "Write a comment…";
  return <Button type="button" variant="light" disableRipple className={styles.prompt} isDisabled={disabled}
    aria-label={label} aria-expanded={false} onPress={onOpen}>
    <LoadingOrb size="md" /><span>{label}</span>
  </Button>;
}
