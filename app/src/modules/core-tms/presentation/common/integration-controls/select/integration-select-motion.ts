import type { PopoverProps } from "@heroui/react";

// Keep the positioned menu's geometry fixed throughout opening and dismissal.
export const integrationSelectMotion = {
  variants: { initial: { opacity: 0 }, enter: { opacity: 1 }, exit: { opacity: 0 } },
  transition: { duration: .12, ease: "easeOut" },
} satisfies NonNullable<PopoverProps["motionProps"]>;
