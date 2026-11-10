import { readFileSync } from "node:fs";
import { join } from "node:path";

const filenames = {
  terms: "terms-of-service.md",
  privacy: "privacy-policy.md",
  billing: "subscription-and-billing.md",
} as const;

export type LegalDocument = keyof typeof filenames;

export function readLegalDocument(document: LegalDocument) {
  const path = join(process.cwd(), "app/src/modules/core-falcon-public/legal/content", filenames[document]);
  const sections = readFileSync(path, "utf8").split(/\r?\n---\r?\n/);
  if (sections.length !== 2 || sections.some(section => !section.trim())) {
    throw new Error(`Missing an English or Russian edition of ${filenames[document]}`);
  }
  const [en, ru] = sections.map(section => section.trim());
  return { en, ru };
}
