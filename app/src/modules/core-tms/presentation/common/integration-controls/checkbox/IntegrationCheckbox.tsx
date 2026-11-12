"use client";
import { Checkbox, type CheckboxProps } from "@heroui/react";
import { forwardRef } from "react";
import { useIntegrationControlDisabled } from "../scope/useIntegrationControlDisabled";
import css from "../styles/integration-controls.module.css";

export const IntegrationCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(function IntegrationCheckbox({ classNames, isDisabled, ...props }, ref) {
  const disabled = useIntegrationControlDisabled(isDisabled);
  return <Checkbox ref={ref} size="sm" {...props} isDisabled={disabled} classNames={{ ...classNames,
    base: `${css.check} ${classNames?.base ?? ""}`, wrapper: `${css.checkBox} ${classNames?.wrapper ?? ""}`,
    icon: `${css.checkIcon} ${classNames?.icon ?? ""}`, label: `${css.checkLabel} ${classNames?.label ?? ""}`,
  }}/ >;
});
