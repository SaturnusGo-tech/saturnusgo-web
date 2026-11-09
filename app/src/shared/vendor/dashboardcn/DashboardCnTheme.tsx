import { cn } from "@heroui/react";
import type { ComponentProps } from "react";
import styles from "./theme.module.css";

export function DashboardCnTheme({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} data-dashboardcn-theme="" className={cn(styles.theme, className)} />;
}
