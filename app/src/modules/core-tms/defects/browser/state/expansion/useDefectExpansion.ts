import { useState } from "react";

export function useDefectExpansion(context: string) {
  const [state, setState] = useState<{ context: string; collapsed: string[] }>({ context, collapsed: [] });
  const collapsed = state.context === context ? state.collapsed : [];
  return {
    collapsed,
    toggle: (component: string) => setState(current => {
      const values = current.context === context ? current.collapsed : [];
      return { context, collapsed: values.includes(component)
        ? values.filter(value => value !== component) : [...values, component] };
    }),
  };
}
