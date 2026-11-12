"use client";
import { Switch, type SwitchProps } from "@heroui/react";
import { forwardRef } from "react";
import { useIntegrationControlDisabled } from "../scope/useIntegrationControlDisabled";
import css from "../styles/integration-controls.module.css";

export const IntegrationSwitch = forwardRef<HTMLInputElement, SwitchProps>(function IntegrationSwitch({ classNames, isDisabled, ...props }, ref) {
  const disabled = useIntegrationControlDisabled(isDisabled);
  return <Switch ref={ref} size="sm" {...props} isDisabled={disabled} classNames={{ ...classNames,
    base: `${css.switch} ${classNames?.base ?? ""}`, wrapper: `${css.switchTrack} ${classNames?.wrapper ?? ""}`,
    thumb: `${css.switchThumb} ${classNames?.thumb ?? ""}`, label: `${css.checkLabel} ${classNames?.label ?? ""}`,
  }}/ >;
});
