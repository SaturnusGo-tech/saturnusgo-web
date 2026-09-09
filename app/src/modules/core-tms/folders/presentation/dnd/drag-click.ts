import { createContext } from "react";
import type { MutableRefObject } from "react";

export const DragClickContext = createContext<MutableRefObject<number>>({ current: 0 });
