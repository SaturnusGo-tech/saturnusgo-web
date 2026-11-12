import type { ComponentProps } from "react";
import type { ErrorToast } from "../../../presentation/common/error/ErrorToast";

// The history contract observes the shared notification boundary, without mounting its browser portal.
export function HistoryToast(_props: ComponentProps<typeof ErrorToast>) {
  return null;
}

export function installHistoryToast(): () => void {
  const loader = require("node:module") as { _load: (name: string, parent: NodeModule | undefined, main?: boolean) => unknown };
  const previous = loader._load;
  loader._load = function (name, parent, main) {
    return name.endsWith("/ErrorToast") ? { ErrorToast: HistoryToast } : previous.call(this, name, parent, main);
  };
  return () => { loader._load = previous; };
}
