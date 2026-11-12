import React from "react";
import type { Props } from "../model/props";

export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(props, ref) {
  const { as = "button", children, onPress, onClick, isDisabled, isLoading, spinner, startContent, endContent,
    radius: _radius, variant: _variant, size: _size, color: _color, disableRipple: _ripple, ...attributes } = props;
  return React.createElement(as as "button", { ...attributes, ref, disabled: Boolean(isDisabled || attributes.disabled),
    "aria-busy": isLoading || undefined, onClick: onClick ?? onPress } as React.ButtonHTMLAttributes<HTMLButtonElement>,
  isLoading ? spinner as React.ReactNode : startContent as React.ReactNode, children as React.ReactNode, endContent as React.ReactNode);
});
