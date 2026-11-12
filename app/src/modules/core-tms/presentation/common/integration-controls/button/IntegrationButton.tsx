"use client";
import { Button, type ButtonProps } from "@heroui/react";
import { forwardRef } from "react";
import { LoadingOrb } from "../../../../../../shared/components/loading/LoadingOrb";
import { useIntegrationControlDisabled } from "../scope/useIntegrationControlDisabled";
import css from "../styles/integration-controls.module.css";

export const IntegrationButton = forwardRef<HTMLButtonElement, ButtonProps>(function IntegrationButton({ className, isDisabled, spinner = <LoadingOrb/>, ...props }, ref) {
  const disabled = useIntegrationControlDisabled(isDisabled);
  return <Button ref={ref} type="button" size="sm" radius="full" variant="flat" disableRipple {...props}
    data-integration-variant={props.variant ?? "flat"} data-integration-color={props.color ?? "default"} data-integration-icon-only={props.isIconOnly || undefined}
    isDisabled={disabled} spinner={spinner} className={`${css.button} ${className ?? ""}`}/>;
});
