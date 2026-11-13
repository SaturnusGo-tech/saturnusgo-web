import { useId, useRef, useState } from "react";
import { requestAuthoringLeave } from "../../application/authoring-leave";
import { useAuthoringSession } from "../useAuthoringSession";

type Options = { id?: string; busy?: boolean; extraDirty?: boolean; revision?: unknown };
/** Compare a mounted form with its prefilled value; never persist its data. */
export function useFormLeave(value: unknown, options: Options = {}) {
  const generatedId = useId();
  const [generation, setGeneration] = useState(0);
  const signature = JSON.stringify(value);
  const baseline = useRef(signature);
  const dirty = signature !== baseline.current || Boolean(options.extraDirty);
  const session = useAuthoringSession({
    id: `${options.id ?? generatedId}:${generation}`, dirty, busy: options.busy,
    revision: JSON.stringify([signature, options.extraDirty ?? false, options.revision]),
  });
  return {
    dirty,
    release: session.release,
    close: (action: () => void | Promise<unknown>) => requestAuthoringLeave(action),
    reset: (savedValue: unknown = value) => {
      session.release();
      baseline.current = JSON.stringify(savedValue);
      setGeneration(current => current + 1);
    },
  };
}
