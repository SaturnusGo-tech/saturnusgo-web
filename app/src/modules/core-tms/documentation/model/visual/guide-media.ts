import type { DocSection } from "../article";

export type DocumentationMedia = {
  id: string;
  title: string;
  instruction: string;
  result: string;
  src: string;
  alt: string;
};
const screenshotPath = /^\/falcon\/docs\/\d{4}-(?:0[1-9]|1[0-2])(-ru)?\/([a-z0-9][a-z0-9-]{0,139})\.jpg$/;

export function documentationMediaLocale(src: string): "en" | "ru" | null {
  const match = screenshotPath.exec(src);
  return match ? match[1] ? "ru" : "en" : null;
}

/** Shared by the server-corpus exporter and the client source validator. */
export function documentationSectionMedia(section: DocSection): DocumentationMedia[] {
  const used = new Set<string>();
  return section.blocks.flatMap(block => {
    if (block.kind !== "walkthrough") return [];
    return block.steps.map(step => {
      const match = screenshotPath.exec(step.image.src);
      if (!match) throw new Error(`Invalid guide screenshot path: ${step.image.src}`);
      const base = match[2];
      let id = base, occurrence = 1;
      while (used.has(id)) id = `${base}-${++occurrence}`;
      used.add(id);
      return { id, title: step.title, instruction: step.instruction, result: step.result,
        src: step.image.src, alt: step.image.alt };
    });
  });
}
