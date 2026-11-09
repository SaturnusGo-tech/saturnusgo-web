"use client";

import { ThinkingOrb, type OrbSize, type OrbTheme } from "thinking-orbs";
import styles from "./loading-orb.module.css";

const presets = { xs: 20, sm: 20, md: 20, lg: 32, brand: 64 } satisfies Record<string, OrbSize>;

export function LoadingOrb({
  size = "sm",
  label,
  className,
  theme,
}: {
  size?: keyof typeof presets;
  label?: string;
  className?: string;
  theme?: OrbTheme;
}) {
  return (
    <span
      className={className ? `${styles.orb} ${className}` : styles.orb}
      data-loading-orb="solving"
      data-size={size}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <ThinkingOrb state="solving" size={presets[size]} theme={theme}
        style={{ width: "100%", height: "100%" }} aria-hidden="true" />
    </span>
  );
}
