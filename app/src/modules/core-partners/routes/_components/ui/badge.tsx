
/* =====================================================================
   app/partners/_components/ui/badge.tsx
   ===================================================================== */
   "use client";
   import * as React from "react";
      
   export type BadgeVariant = "default" | "secondary" | "outline";
   export function Badge({ variant = "default", className = "", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
     const cls = ["ui-badge", className];
     if (variant === "secondary") cls.push("is-secondary");
     if (variant === "outline") cls.push("is-outline");
     return <span className={cls.join(" ")} {...props} />;
   }