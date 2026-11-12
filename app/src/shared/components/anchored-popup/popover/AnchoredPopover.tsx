"use client";
import { Popover, type PopoverProps } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { anchoredPopupMotion } from "../motion/anchored-popup-motion";

export const AnchoredPopover = forwardRef<HTMLDivElement, PopoverProps>(function AnchoredPopover(props, ref) {
  const reduced = useReducedMotion();
  return <Popover {...props} ref={ref} disableAnimation={reduced ? true : props.disableAnimation}
    motionProps={anchoredPopupMotion(props.motionProps)}/>;
});
