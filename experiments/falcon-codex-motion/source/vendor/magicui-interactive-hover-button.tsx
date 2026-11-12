// Source: https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/interactive-hover-button.tsx
// Retrieved 2026-11-12. MIT Copyright (c) Magic UI; see ./MagicUI-LICENSE.md.
// Local adaptation: React default import and clsx replace cn; duplicate decorative hover label is hidden from assistive technology.
import React from "react"
import { ArrowRight } from "lucide-react"
import clsx from "clsx"

export function InteractiveHoverButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "group bg-background relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        <div className="bg-primary h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]"></div>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div aria-hidden="true" className="text-primary-foreground absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight />
      </div>
    </button>
  )
}
