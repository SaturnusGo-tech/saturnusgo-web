import {
  CORE_HOME_ANCHOR_FLASH_CLASS_NAME,
  CORE_HOME_ANCHOR_FLASH_DURATION_MS,
  CORE_HOME_ANCHOR_HASHES,
  CORE_HOME_CANONICAL_ANCHOR_ID,
} from "../../../constants";
import type { CoreHomeAnchorTarget, CoreHomeAnchorInput } from "../../../types";

export function resolveCoreHomeAnchorTarget({
  hash,
  search,
}: CoreHomeAnchorInput): CoreHomeAnchorTarget | null {
  const normalizedHash = normalizeAnchorInput(hash.replace(/^#/, ""));
  const normalizedQueryTarget = normalizeAnchorInput(
    new URLSearchParams(search).get("to") ?? "",
  );

  return normalizedHash ?? normalizedQueryTarget;
}

export function scrollToHomeAnchor(target: CoreHomeAnchorTarget): void {
  const element = document.getElementById(target);

  if (!element) {
    return;
  }

  requestAnimationFrame(() => {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    element.classList.add(CORE_HOME_ANCHOR_FLASH_CLASS_NAME);

    window.setTimeout(() => {
      element.classList.remove(CORE_HOME_ANCHOR_FLASH_CLASS_NAME);
    }, CORE_HOME_ANCHOR_FLASH_DURATION_MS);
  });
}

function normalizeAnchorInput(value: string): CoreHomeAnchorTarget | null {
  const candidate = value.trim().toLowerCase();
  const isSupported = CORE_HOME_ANCHOR_HASHES.includes(
    candidate as (typeof CORE_HOME_ANCHOR_HASHES)[number],
  );

  return isSupported ? CORE_HOME_CANONICAL_ANCHOR_ID : null;
}
