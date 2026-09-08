import type { ScreenshotStep } from "../../../model/visual/walkthrough";
import screenshots from "./screenshots.json";

export function screenshotStep(file: keyof typeof screenshots, title: string, instruction: string, result: string, alt: string): ScreenshotStep {
  return { title, instruction, result, image: {
    src: `/falcon/docs/2026-09/${file}.jpg`, alt, ...screenshots[file],
  } };
}
