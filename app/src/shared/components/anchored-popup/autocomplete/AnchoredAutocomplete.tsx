"use client";
import { Autocomplete, type AutocompleteProps } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { forwardRef } from "react";
import { anchoredPopupMotion } from "../motion/anchored-popup-motion";

export const AnchoredAutocomplete = forwardRef<HTMLInputElement, AutocompleteProps<object>>(function AnchoredAutocomplete(props, ref) {
  const reduced = useReducedMotion();
  return <Autocomplete {...props} ref={ref} disableAnimation={reduced ? true : props.disableAnimation}
    popoverProps={{ ...props.popoverProps,
      ...(reduced ? { disableAnimation: true } : {}),
      motionProps: anchoredPopupMotion(props.popoverProps?.motionProps),
    }}/>;
}) as typeof Autocomplete;
