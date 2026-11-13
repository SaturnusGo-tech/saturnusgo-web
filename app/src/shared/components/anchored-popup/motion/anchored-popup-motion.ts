import type { PopoverProps } from "@heroui/react";
import styles from "./anchored-popup.module.css";

type PopupMotion = NonNullable<PopoverProps["motionProps"]>;

const phases = {
  initial: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Positioning owns geometry; opening and dismissal only change visibility. */
export function anchoredPopupMotion(existing?: PopupMotion): PopupMotion {
  return {
    ...existing,
    initial: false,
    className: `${styles.entrance} ${existing?.className ?? ""}`,
    style: { ...existing?.style, maxHeight: "inherit" },
    animate: "enter",
    exit: "exit",
    variants: phases,
    transition: { duration: 0.12, ease: "easeOut" },
  };
}
