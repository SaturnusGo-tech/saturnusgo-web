"use client";
import { Textarea, type TextAreaProps } from "@heroui/react";
import { forwardRef } from "react";
import { useIntegrationControlDisabled } from "../scope/useIntegrationControlDisabled";
import { useInputShellRef } from "../refs/useInputShellRef";
import css from "../styles/integration-controls.module.css";

export const IntegrationTextarea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function IntegrationTextarea({ classNames, isDisabled, wrapperRef, ...props }, ref) {
  const disabled = useIntegrationControlDisabled(isDisabled);
  const shellRef = useInputShellRef(wrapperRef);
  return <Textarea ref={ref} wrapperRef={shellRef} size="sm" variant="flat" labelPlacement="outside-top" minRows={3} maxRows={8} {...props} isDisabled={disabled}
    classNames={{ ...classNames,
      base: `${css.field} ${classNames?.base ?? ""}`, label: `${css.label} ${classNames?.label ?? ""}`,
      mainWrapper: `${css.main} ${classNames?.mainWrapper ?? ""}`, inputWrapper: `${css.textareaWrapper} ${classNames?.inputWrapper ?? ""}`,
      innerWrapper: `${css.inner} ${classNames?.innerWrapper ?? ""}`, input: `${css.textarea} ${classNames?.input ?? ""}`,
      description: `${css.description} ${classNames?.description ?? ""}`, errorMessage: `${css.error} ${classNames?.errorMessage ?? ""}`,
    }}/ >;
});
