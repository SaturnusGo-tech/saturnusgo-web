import {
  CORE_INVESTORS_CTA_SECTION_ID,
  CORE_INVESTORS_OPEN_DECK_EVENT_NAME,
} from "../../../constants";

export function scrollToCoreInvestorsCta(): void {
  const element = document.getElementById(CORE_INVESTORS_CTA_SECTION_ID);

  if (!element) {
    return;
  }

  requestAnimationFrame(() => {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function openCoreInvestorsDeck(): void {
  window.dispatchEvent(new Event(CORE_INVESTORS_OPEN_DECK_EVENT_NAME));
}
