"use client";
import { Dropdown, type DropdownProps } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { anchoredPopupMotion } from "../motion/anchored-popup-motion";

export function AnchoredDropdown(props: DropdownProps) {
  const reduced = useReducedMotion();
  return <Dropdown {...props} disableAnimation={reduced ? true : props.disableAnimation}
    motionProps={anchoredPopupMotion(props.motionProps)}/>;
}
