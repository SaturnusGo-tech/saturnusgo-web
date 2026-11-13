import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { useFormLeave } from "../../state/value/useFormLeave";

export function formHarness() {
  const h = componentHarness(); let session: { dirty: boolean; busy?: boolean; revision?: string } | undefined;
  let allowed = false, released = 0;
  const { useFormLeave: useLeave } = h.load<{ useFormLeave: typeof useFormLeave }>(new URL("../../state/value/useFormLeave.ts", import.meta.url), name => {
    if (name.endsWith("useAuthoringSession")) return { useAuthoringSession: (next: typeof session) => {
      session = next; return { release: () => { released++; } };
    } };
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: async (action: () => void) => {
      if (session?.busy || (session?.dirty && !allowed)) return false; action(); return true;
    } };
    return undefined;
  });
  return { h, session: () => session, released: () => released, approve: () => { allowed = true; },
    load: <T>(url: URL, resolve: (name: string) => unknown) => h.load<T>(url, name =>
      name.endsWith("useFormLeave") ? { useFormLeave: useLeave } : resolve(name)),
    render: (render: () => unknown) => nodes(h.render(render)) };
}
