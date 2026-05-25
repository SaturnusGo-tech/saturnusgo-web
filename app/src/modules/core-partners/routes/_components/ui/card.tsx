
/* =====================================================================
   app/partners/_components/ui/card.tsx
   ===================================================================== */
   "use client";
   import * as React from "react";
   export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
     return <div className={["ui-card", className].join(" ")} {...props} />;
   }
   export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
     return <div className={["ui-card__content", className].join(" ")} {...props} />;
   }
   