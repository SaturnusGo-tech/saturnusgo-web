import { createState } from "lexical";

export const sectionIdState = createState("falconProductDocSectionId", {
  parse: (value): string | null => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : null,
});

export const literalHeadingState = createState("falconProductDocLiteralHeading", { parse: Boolean });
