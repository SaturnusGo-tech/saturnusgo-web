import type { ScreenshotStep } from "../../../model/visual/walkthrough";
import screenshots from "./screenshots.json";
import production from "./screenshots.production.json";

export function screenshotStep(file: keyof typeof screenshots | keyof typeof production, title: string, instruction: string, result: string, alt: string): ScreenshotStep {
  const captures: Readonly<Record<string, { src: string; width: number; height: number }>> = production;
  const previous = screenshots[file as keyof typeof screenshots];
  const image = captures[file] ?? (previous && { src: `/falcon/docs/2026-09/${file}.jpg`, ...previous });
  if (!image) throw new Error(`Unregistered English guide screenshot: ${file}`);
  return { title, instruction, result, image: {
    ...image, alt,
  } };
}
