import type { ScreenshotStep } from "../../model/visual/walkthrough";

const states = ["overview", "rule", "editor", "case", "run"] as const;
type CaptureState = (typeof states)[number];
type CaptureLocale = "en" | "ru";

const capturePath = (locale: CaptureLocale, state: CaptureState) =>
  `/falcon/docs/2026-11-preview${locale === "ru" ? "-ru" : ""}/product-docs-${state}.jpg`;

// Only these deliberately synthetic screenshots may appear in public Falcon Help.
export function isProductDocsPreviewImage(src: string, locale: CaptureLocale) {
  return states.some(state => capturePath(locale, state) === src);
}

export function productDocsCapture(
  locale: CaptureLocale,
  state: CaptureState,
  title: string,
  instruction: string,
  result: string,
  alt: string,
): ScreenshotStep {
  return { title, instruction, result, image: { src: capturePath(locale, state), width: 3456, height: 2234, alt } };
}
