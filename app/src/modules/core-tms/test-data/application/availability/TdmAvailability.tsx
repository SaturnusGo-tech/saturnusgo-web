import { createContext, useContext, type ReactNode } from "react";
export type TdmAvailability = { readonly enabled: boolean; readonly pending: boolean; readonly error: boolean; retry(): void };
const Context = createContext<TdmAvailability>({ enabled: false, pending: false, error: false, retry() {} });
export function TdmAvailabilityProvider({ value, children }: { value: TdmAvailability; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useTdmAvailability() { return useContext(Context); }
