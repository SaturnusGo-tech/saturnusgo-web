import { Select, SelectItem } from "@heroui/react";
import dashboardStyles from "../../../../../dashboard.module.css";
import styles from "./insight-controls.module.css";

type Option = { key: string; label: string };
export type InsightControl = { label: string; value: string; options: readonly Option[]; onChange?: (key: string) => void };

export function InsightsControls({ total, noun, controls, portalContainer }: {
  total: string; noun: string; controls: readonly InsightControl[]; portalContainer?: Element;
}) {
  return <aside className={styles.panel} aria-label={controls[0]?.label}>
    <div className={styles.total}><strong>{total}</strong><span>{noun}</span></div>
    <div className={styles.fields}>
      {controls.map(control => <div key={control.label} className={styles.field}>
        <span>{control.label}</span>
        <Select aria-label={control.label} size="sm" variant="flat" isDisabled={!control.onChange || control.options.length === 1}
          selectedKeys={[control.value]} disallowEmptySelection disableAnimation
          popoverProps={{
            portalContainer, offset: 5,
            // Focusing an option can scroll the fullscreen surface during opening.
            shouldCloseOnScroll: !portalContainer,
          }}
          classNames={{ trigger: styles.trigger, value: styles.value, selectorIcon: styles.arrow, popoverContent: `${styles.menu} ${dashboardStyles.popupEnter}` }}
          listboxProps={{ classNames: { base: styles.options, list: styles.optionList },
            itemClasses: { base: styles.option, title: styles.optionTitle, selectedIcon: styles.selectedIcon } }}
          onSelectionChange={keys => {
            if (keys === "all") return;
            const [value] = keys;
            if (typeof value === "string" && value !== control.value) control.onChange?.(value);
          }}>
          {control.options.map(option => <SelectItem key={option.key}>{option.label}</SelectItem>)}
        </Select>
      </div>)}
    </div>
  </aside>;
}
