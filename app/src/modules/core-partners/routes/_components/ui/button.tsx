/* =====================================================================
   app/partners/_components/ui/button.tsx
   ===================================================================== */
   "use client";
   import * as React from "react";
   type Variant = "primary" | "secondary" | "outline" | "ghost";
   type Size = "sm" | "md" | "lg";
   export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size; }
   export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
     ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
       const cls = ["ui-btn", className, `v-${variant}`, `size-${size}`].join(" ");
       return <button ref={ref} className={cls} {...props} />;
     }
   );
   Button.displayName = "Button";