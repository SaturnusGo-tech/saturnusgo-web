import type { ReactNode } from "react";

export type Props = Record<string, unknown> & { children?: ReactNode | ((close: () => void) => ReactNode) };
