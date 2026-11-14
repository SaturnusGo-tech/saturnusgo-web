import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useTestData } from "../context/TestDataContext";
import type { BindingValidation, TestDataBinding } from "../../model/bindings/binding";
type Value = { readonly bindings: readonly TestDataBinding[]; readonly validation: BindingValidation | null; readonly loading: boolean; readonly error: boolean;
  readonly editable: boolean; readonly savedCase?: { readonly caseId: string; readonly revision: number }; readonly onRequestEdit?: () => void;
  readonly onChange?: (bindings: readonly TestDataBinding[]) => void; readonly retry: () => void };
const Context = createContext<Value | null>(null);
export function CaseDataProvider({ bindings, steps, editable, savedCase, onRequestEdit, onChange, children }: {
  bindings: readonly TestDataBinding[]; steps: readonly { id: string; action: string; expectedResult: string }[]; editable: boolean;
  savedCase?: { readonly caseId: string; readonly revision: number }; onRequestEdit?: () => void;
  onChange?: (bindings: readonly TestDataBinding[]) => void; children: ReactNode;
}) {
  const feature = useTestData(), [validation, setValidation] = useState<BindingValidation | null>(null);
  const [loading, setLoading] = useState(false), [error, setError] = useState(false), [revision, setRevision] = useState(0);
  const signature = JSON.stringify({ bindings, steps, savedCase });
  useEffect(() => {
    const controller = new AbortController(); setValidation(null); setError(false);
    if (!feature || !feature.permissions.read || !feature.permissions.bind) { setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(() => { void feature.port.validate(bindings, steps, controller.signal, savedCase).then(value => {
      if (!controller.signal.aborted) { setValidation(value); setLoading(false); }
    }).catch(() => { if (!controller.signal.aborted) { setError(true); setLoading(false); } }); }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [feature, signature, revision]);
  return <Context.Provider value={{ bindings, validation, loading, error, editable, savedCase, onRequestEdit, onChange, retry: () => setRevision(value => value + 1) }}>{children}</Context.Provider>;
}
export function useCaseData() { return useContext(Context); }
