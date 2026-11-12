"use client";
import { FreeSoloPopover, type FreeSoloPopoverProps } from "@heroui/popover";
import { useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { anchoredPopupMotion } from "../motion/anchored-popup-motion";

export const AnchoredFreeSoloPopover = forwardRef<HTMLDivElement, FreeSoloPopoverProps>(function AnchoredFreeSoloPopover(props, ref) {
  const reduced = useReducedMotion();
  return <FreeSoloPopover {...props} ref={ref} disableAnimation={reduced ? true : props.disableAnimation}
    motionProps={anchoredPopupMotion(props.motionProps)}/>;
});
