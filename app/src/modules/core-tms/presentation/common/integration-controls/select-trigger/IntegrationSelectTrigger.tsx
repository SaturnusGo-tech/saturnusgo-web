"use client";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { DOMEventNames, filterDOMProps } from "@heroui/react-utils";

// HeroUI 2.8 joins generated label IDs with commas; ARIA ID references require spaces.
export const IntegrationSelectTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(function IntegrationSelectTrigger(props, ref) {
  const labelledBy = props["aria-labelledby"]?.split(/[,\s]+/).filter(Boolean).join(" ");
  const domProps = filterDOMProps(props, { enabled: true });
  for (const [name, value] of Object.entries(props)) {
    if (name.endsWith("Capture") && DOMEventNames.has(name.slice(0, -7))) (domProps as Record<string, unknown>)[name] = value;
  }
  return <button type="button" {...domProps} ref={ref} aria-labelledby={labelledBy || undefined} onPointerDownCapture={event => {
    props.onPointerDownCapture?.(event);
    // HeroUI opens on pointerdown, before the browser's default button focus.
    // Focus first so its overlay restores this trigger rather than the previous control.
    if (!event.defaultPrevented && event.button === 0 && !props.disabled) event.currentTarget.focus({ preventScroll: true });
  }}>{props.children}</button>;
});
