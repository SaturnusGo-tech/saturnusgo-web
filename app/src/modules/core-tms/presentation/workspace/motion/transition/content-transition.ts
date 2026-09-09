import { flushSync } from "react-dom";

type Transition = { skipTransition(): void; finished: Promise<void>; updateCallbackDone: Promise<void> };
type MotionDocument = Document & { startViewTransition?: (update: () => void) => Transition };
let active: Transition | undefined;
let generation = 0;

/** Navigation only: native snapshots crossfade while the live editor tree stays intact. */
export function transitionContent(update: () => void) {
  const current = ++generation;
  active?.skipTransition();
  const document = globalThis.document as MotionDocument | undefined;
  if (!document?.startViewTransition || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    if (document) delete document.documentElement.dataset.falconTransition;
    active = undefined; update(); return;
  }
  let committed = false;
  document.documentElement.dataset.falconTransition = "true";
  const commit = () => { if (current !== generation) return; committed = true; flushSync(update); };
  try { active = document.startViewTransition(commit); }
  catch (error) {
    delete document.documentElement.dataset.falconTransition;
    active = undefined;
    if (committed) throw error;
    update(); return;
  }
  // A skipped visual transition is normal on a fast second navigation. Update errors are not.
  void active.updateCallbackDone.catch((error: unknown) => { globalThis.reportError(error); });
  void active.finished.then(cleanup, cleanup);
  function cleanup() {
    if (current !== generation) return;
    active = undefined;
    delete document!.documentElement.dataset.falconTransition;
  }
}
