"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import {
  useLandingMotionEnabled,
  useLandingScrollProgress,
} from "./useLandingScrollProgress";

export function Reveal({
  children,
  className,
  variant = "content",
}: {
  children: ReactNode;
  className?: string;
  variant?: "content" | "media";
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const motionEnabled = useLandingMotionEnabled();
  const progress = useLandingScrollProgress(anchor, motionEnabled);
  const smoothProgress = useSpring(progress, {
    stiffness: 140,
    damping: 28,
    mass: 0.45,
    restDelta: 0.0001,
    restSpeed: 0.001,
  });
  const y = useTransform(
    smoothProgress,
    [0, 0.36, 0.76, 1],
    variant === "media" ? [72, 0, 0, -32] : [34, 0, 0, -14],
  );
  const opacity = useTransform(
    smoothProgress,
    [0, 0.3, 0.8, 1],
    [0.6, 1, 1, 0.85],
  );

  return (
    <div ref={anchor} data-landing-reveal={variant}>
      <motion.div
        className={className}
        data-landing-motion=""
        initial={false}
        style={
          motionEnabled
            ? { y, opacity: variant === "media" ? 1 : opacity }
            : { y: 0, opacity: 1 }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
