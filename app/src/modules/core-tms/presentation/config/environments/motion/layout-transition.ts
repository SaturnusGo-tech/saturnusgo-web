import { flushSync } from "react-dom";

type Transition = { finished: Promise<void>; updateCallbackDone: Promise<void>; skipTransition(): void };
let generation = 0;
let active: Transition | undefined;
/** Preserve each environment row as the same visual element while its editor expands. */
export function transitionEnvironmentLayout(update: () => void) {
  const current = ++generation;
  const document = globalThis.document as Document & { startViewTransition?: (update: () => void) => Transition };
  active?.skipTransition();
  if (!document?.startViewTransition || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { update(); return; }
  document.documentElement.dataset.environmentTransition = "true";
  let committed = false;
  try {
    const transition = document.startViewTransition(() => { if (current !== generation) return; committed = true; flushSync(update); });
    active = transition;
    const cleanup = () => { if (active === transition) { delete document.documentElement.dataset.environmentTransition; active = undefined; } };
    const finished = transition.finished.then(cleanup, cleanup);
    return transition.updateCallbackDone.then(() => finished);
  } catch (error) {
    delete document.documentElement.dataset.environmentTransition;
    if (committed) throw error;
    update();
  }
}
