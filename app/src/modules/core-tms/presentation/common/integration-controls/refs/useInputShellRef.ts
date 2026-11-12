"use client";
import { useCallback, type MutableRefObject, type Ref, type RefCallback } from "react";

/** Mark HeroUI's visible wrapper without changing its native editor ref. */
export function useInputShellRef(externalRef?: Ref<HTMLDivElement>): RefCallback<HTMLDivElement> {
  return useCallback((node: HTMLDivElement | null) => {
    node?.setAttribute("data-input-shell", "");
    if (typeof externalRef === "function") externalRef(node);
    else if (externalRef) (externalRef as MutableRefObject<HTMLDivElement | null>).current = node;
  }, [externalRef]);
}
