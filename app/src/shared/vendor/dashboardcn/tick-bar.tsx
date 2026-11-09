import * as React from "react"

import { cn } from "@heroui/react"

export interface TickBarProps extends React.ComponentProps<"div"> {
  /** Current value, from 0 to max. */
  value: number
  max?: number
  /** Number of ticks. */
  segments?: number
  /** Any CSS color for the filled ticks. Defaults to chart-1. */
  color?: string
  /** Any CSS color for the unfilled ticks. Defaults to muted. */
  trackColor?: string
  /** "tick" draws thin bars; "pill" draws wide rounded ones. */
  shape?: "tick" | "pill"
  /** Reveal filled ticks in sequence when the bar mounts. */
  animate?: boolean
  /** Total reveal time in milliseconds. */
  animationDuration?: number
}

/** A progress bar drawn as a row of ticks, lit up to the current value. */
function TickBar({
  value,
  max = 100,
  segments = 40,
  color = "var(--chart-1)",
  trackColor,
  shape = "tick",
  animate = false,
  animationDuration = 700,
  className,
  style,
  ...props
}: TickBarProps) {
  const fraction = Math.min(1, Math.max(0, value / (max || 1)))
  const filled = fraction * segments
  // Narrow bars need room for the ticks as well as the gaps.
  const gap = `min(${shape === "tick" ? 3 : 6}px, ${35 / Math.max(1, segments)}%)`

  return (
    <div
      data-slot="tick-bar"
      data-shape={shape}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        "flex w-full",
        shape === "tick" ? "h-6" : "h-4",
        className
      )}
      style={{ columnGap: gap, ...style }}
      {...props}
    >
      {Array.from({ length: segments }, (_, index) => {
        const fill = Math.min(1, Math.max(0, filled - index))
        return (
          <span
            key={index}
            data-filled={fill > 0}
            className={cn(
              "bg-muted relative h-full min-w-0 flex-1 overflow-hidden transition-colors",
              shape === "tick" ? "rounded-[1.5px]" : "rounded-full"
            )}
            style={{ backgroundColor: trackColor }}
          >
            {fill > 0 ? (
              <span
                className={cn(
                  "absolute inset-0",
                  shape === "tick" ? "rounded-[1.5px]" : "rounded-full",
                  animate && "motion-safe:animate-in motion-safe:fade-in"
                )}
                style={{
                  backgroundColor: color,
                  insetInlineEnd: fill === 1 ? undefined : `${(1 - fill) * 100}%`,
                  ...(animate
                    ? {
                        animationDelay: `${(index / Math.max(1, filled)) * animationDuration * 0.8}ms`,
                        animationDuration: `${Math.max(120, animationDuration * 0.25)}ms`,
                        animationFillMode: "both",
                      }
                    : null),
                }}
              />
            ) : null}
          </span>
        )
      })}
    </div>
  )
}

export { TickBar }
