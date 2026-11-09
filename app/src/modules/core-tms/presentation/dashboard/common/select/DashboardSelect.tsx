"use client";

import { Select, SelectItem } from "@heroui/react";
import dashboardStyles from "../../dashboard.module.css";
import styles from "./dashboard-select.module.css";

type Props = {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
  isDisabled?: boolean;
  placeholder?: string;
};

export function DashboardSelect({ label, value, options, onChange, className, isDisabled, placeholder }: Props) {
  return <Select aria-label={label} size="sm" variant="flat" selectedKeys={value ? [value] : []} disallowEmptySelection disableAnimation
    isDisabled={isDisabled} placeholder={placeholder} className={className}
    classNames={{ base: styles.select, trigger: styles.trigger, value: styles.value,
      selectorIcon: styles.selectorIcon, popoverContent: `${styles.popover} ${dashboardStyles.popupEnter}` }}
    popoverProps={{ placement: "bottom-start" }}
    listboxProps={{ classNames: { list: styles.options }, itemClasses: { base: styles.option, title: styles.optionTitle } }}
    onSelectionChange={keys => {
      if (keys === "all") return;
      const option = options.find(item => keys.has(item.value));
      if (option) onChange(option.value);
    }}>
    {options.map(option => <SelectItem key={option.value}>{option.label}</SelectItem>)}
  </Select>;
}
