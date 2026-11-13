import type { ReactNode } from "react";

export interface ProductDocMenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  run(): void;
}
