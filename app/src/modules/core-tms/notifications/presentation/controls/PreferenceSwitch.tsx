import { Switch } from "@heroui/react";
import { useId } from "react";
import styles from "../notifications.module.css";
export function PreferenceSwitch({ label, description, selected, disabled, onChange, recommended }: {
  label: string; description?: string; selected: boolean; disabled?: boolean;
  onChange?: (selected: boolean) => void; recommended?: string;
}) {
  const id = useId();
  return <Switch size="sm" isSelected={selected} isDisabled={disabled} onValueChange={onChange}
    aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
    classNames={{ base: styles.preference, wrapper: styles.switchTrack, thumb: styles.switchThumb, label: styles.switchLabel }}>
    <span className={styles.preferenceTitle} id={`${id}-title`}>{label}{recommended && <span className={styles.recommended}>{recommended}</span>}</span>
    {description && <span className={styles.preferenceDescription} id={`${id}-description`}>{description}</span>}
  </Switch>;
}
