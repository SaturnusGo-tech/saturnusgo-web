import React from "react";
import type { Props } from "../model/props";

export function Checkbox(props: Props) {
  const { children, isSelected, isDisabled, onValueChange, classNames } = props;
  const classes = classNames as Record<string, string> | undefined;
  return <label className={classes?.base} data-selected={Boolean(isSelected)} data-disabled={Boolean(isDisabled)}>
    <input type="checkbox" checked={Boolean(isSelected)} disabled={Boolean(isDisabled)}
      onChange={event => (onValueChange as ((value: boolean) => void) | undefined)?.(event.target.checked)}/>
    <span className={classes?.label}>{children as React.ReactNode}</span>
  </label>;
}
