"use client";
import { Select, type SelectProps } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { anchoredPopupMotion } from "../motion/anchored-popup-motion";

export const AnchoredSelect = forwardRef<HTMLSelectElement, SelectProps<object>>(function AnchoredSelect(props, ref) {
  const reduced = useReducedMotion();
  return <Select {...props} ref={ref} disableAnimation={reduced ? true : props.disableAnimation}
    popoverProps={{ ...props.popoverProps,
      ...(reduced ? { disableAnimation: true } : {}),
      motionProps: anchoredPopupMotion(props.popoverProps?.motionProps),
    }}/>;
}) as typeof Select;
