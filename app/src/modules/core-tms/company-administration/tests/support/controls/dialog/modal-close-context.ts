import { createContext } from "react";

export const CloseContext = createContext<() => void>(() => {});
