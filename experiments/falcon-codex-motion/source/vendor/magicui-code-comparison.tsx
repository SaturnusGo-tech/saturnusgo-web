"use client"

// Source: https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/code-comparison.tsx
// Retrieved 2026-11-12. MIT Copyright (c) Magic UI; see ./MagicUI-LICENSE.md.
// Local adaptation: React default import, clsx, optional labels/titles/className.
// Shiki syntax highlighting, diff/focus annotations, and next-themes selection are
// omitted for this fixed illustrative HTTP-response prototype. This uses the
// upstream React <pre> fallback and keeps its two-pane composition/classes.
import React from "react"
import { FileIcon } from "lucide-react"
import clsx from "clsx"

interface CodeComparisonProps {
  beforeCode: string
  afterCode: string
  filename?: string
  language?: string
  lightTheme?: string
  darkTheme?: string
  highlightColor?: string
  beforeLabel?: React.ReactNode
  afterLabel?: React.ReactNode
  beforeTitle?: React.ReactNode
  afterTitle?: React.ReactNode
  className?: string
}

export function CodeComparison({
  beforeCode,
  afterCode,
  filename = "response.http",
  beforeLabel = "before",
  afterLabel = "after",
  beforeTitle,
  afterTitle,
  className,
}: CodeComparisonProps) {
  const renderCode = (code: string) => (
    <pre className="bg-background text-foreground h-full overflow-auto p-4 font-mono text-xs break-all">
      {code}
    </pre>
  )

  return (
    <div className={clsx("mx-auto w-full max-w-5xl", className)}>
      <div className="group border-border relative w-full overflow-hidden rounded-md border">
        <div className="relative grid md:grid-cols-2">
          <div
            className={clsx(
              "leftside group/left border-primary/20 md:border-r",
              "[&>div>pre>code>:not(.focused)]:transition-all [&>div>pre>code>:not(.focused)]:duration-300"
            )}
          >
            <div className="border-primary/20 bg-accent text-foreground flex items-center border-b p-2 text-sm">
              <FileIcon className="mr-2 h-4 w-4" />
              {beforeTitle ?? filename}
              <span className="ml-auto hidden md:block">{beforeLabel}</span>
            </div>
            {renderCode(beforeCode)}
          </div>
          <div
            className={clsx(
              "rightside group/right border-primary/20 border-t md:border-t-0",
              "[&>div>pre>code>:not(.focused)]:transition-all [&>div>pre>code>:not(.focused)]:duration-300"
            )}
          >
            <div className="border-primary/20 bg-accent text-foreground flex items-center border-b p-2 text-sm">
              <FileIcon className="mr-2 h-4 w-4" />
              {afterTitle ?? filename}
              <span className="ml-auto hidden md:block">{afterLabel}</span>
            </div>
            {renderCode(afterCode)}
          </div>
        </div>
        <div className="border-primary/20 bg-accent text-foreground absolute top-1/2 left-1/2 hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border text-xs md:flex">
          VS
        </div>
      </div>
    </div>
  )
}
