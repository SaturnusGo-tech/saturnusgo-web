"use client";
import { Input, type InputProps } from "@heroui/react";
import { forwardRef } from "react";
import { useIntegrationControlDisabled } from "../scope/useIntegrationControlDisabled";
import { useInputShellRef } from "../refs/useInputShellRef";
import css from "../styles/integration-controls.module.css";

export const IntegrationInput = forwardRef<HTMLInputElement, InputProps>(function IntegrationInput({ classNames, isDisabled, wrapperRef, ...props }, ref) {
  const disabled = useIntegrationControlDisabled(isDisabled);
  const shellRef = useInputShellRef(wrapperRef);
  return <Input ref={ref} wrapperRef={shellRef} size="sm" variant="flat" labelPlacement="outside-top" {...props} isDisabled={disabled}
    classNames={{ ...classNames,
      base: `${css.field} ${classNames?.base ?? ""}`, label: `${css.label} ${classNames?.label ?? ""}`,
      mainWrapper: `${css.main} ${classNames?.mainWrapper ?? ""}`, inputWrapper: `${css.inputWrapper} ${classNames?.inputWrapper ?? ""}`,
      innerWrapper: `${css.inner} ${classNames?.innerWrapper ?? ""}`, input: `${css.input} ${classNames?.input ?? ""}`,
      description: `${css.description} ${classNames?.description ?? ""}`, errorMessage: `${css.error} ${classNames?.errorMessage ?? ""}`,
    }}/ >;
});
