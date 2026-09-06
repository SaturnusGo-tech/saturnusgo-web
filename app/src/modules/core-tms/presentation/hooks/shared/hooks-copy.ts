import { enHooksCopy } from "./copy/hooks-copy-en";
import { ruHooksCopy } from "./copy/hooks-copy-ru";

export function hooksCopy(russian: boolean) {
  return russian ? ruHooksCopy : enHooksCopy;
}

export type HooksCopy = ReturnType<typeof hooksCopy>;
